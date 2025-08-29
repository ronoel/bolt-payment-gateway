// src/database/repositories/payment_repository.rs
use mongodb::{Collection, Database, bson::doc, IndexModel, options::IndexOptions};
use futures::stream::TryStreamExt;
use anyhow::Result;
use bson;
use crate::models::{Payment, PaymentStatus};

#[derive(Clone)]
pub struct PaymentRepository {
    collection: Collection<Payment>,
}

impl PaymentRepository {
    pub fn new(database: &Database) -> Self {
        let collection = database.collection::<Payment>("payments");
        Self { collection }
    }

    /// Creates the unique partial index for payments
    /// This index ensures that only one payment with status "accepted" or "confirmed" 
    /// can exist per invoice_id
    pub async fn create_indexes(&self) -> Result<()> {
        // Create a partial unique index on invoice_id where status is "accepted" or "confirmed"
        let keys = doc! { 
            "invoice_id": 1 
        };
        
        let options = IndexOptions::builder()
            .unique(true)
            .partial_filter_expression(doc! {
                "status": {
                    "$in": ["accepted", "confirmed"]
                }
            })
            .name("unique_invoice_payment_status".to_string())
            .build();
        
        let index = IndexModel::builder()
            .keys(keys)
            .options(options)
            .build();
        
        self.collection.create_index(index).await?;
        
        // Also create a general index on invoice_id for better query performance
        let general_index = IndexModel::builder()
            .keys(doc! { "invoice_id": 1 })
            .options(IndexOptions::builder().name("invoice_id_index".to_string()).build())
            .build();
        
        self.collection.create_index(general_index).await?;
        
        Ok(())
    }

    pub async fn create(&self, payment: &Payment) -> Result<()> {
        self.collection.insert_one(payment).await?;
        Ok(())
    }

    pub async fn find_by_id(&self, payment_id: &bson::oid::ObjectId) -> Result<Option<Payment>> {
        let filter = doc! { "_id": payment_id };
        let result = self.collection.find_one(filter).await?;
        Ok(result)
    }

    pub async fn find_by_invoice_id(&self, invoice_id: &bson::oid::ObjectId) -> Result<Vec<Payment>> {
        let filter = doc! { "invoice_id": invoice_id };
        let mut cursor = self.collection.find(filter).await?;
        let mut payments = Vec::new();
        
        while let Some(payment) = cursor.try_next().await? {
            payments.push(payment);
        }
        
        Ok(payments)
    }

    pub async fn find_by_tx_id(&self, tx_id: &str) -> Result<Option<Payment>> {
        let filter = doc! { "tx_id": tx_id };
        let result = self.collection.find_one(filter).await?;
        Ok(result)
    }

    pub async fn update_status(&self, payment_id: &bson::oid::ObjectId, status: PaymentStatus) -> Result<bool> {
        let filter = doc! { "_id": payment_id };
        let update = doc! { "$set": { "status": bson::to_bson(&status)? } };
        
        let result = self.collection.update_one(filter, update).await?;
        Ok(result.modified_count > 0)
    }

    pub async fn update_tx_id(&self, payment_id: &bson::oid::ObjectId, tx_id: &str) -> Result<bool> {
        let filter = doc! { "_id": payment_id };
        let update = doc! { "$set": { "tx_id": tx_id } };
        
        let result = self.collection.update_one(filter, update).await?;
        Ok(result.modified_count > 0)
    }

    pub async fn find_by_status(&self, status: PaymentStatus) -> Result<Vec<Payment>> {
        let filter = doc! { "status": bson::to_bson(&status)? };
        let mut cursor = self.collection.find(filter).await?;
        let mut payments = Vec::new();
        
        while let Some(payment) = cursor.try_next().await? {
            payments.push(payment);
        }
        
        Ok(payments)
    }

    pub async fn find_accepted_or_confirmed_by_invoice(&self, invoice_id: &bson::oid::ObjectId) -> Result<Option<Payment>> {
        let filter = doc! { 
            "invoice_id": invoice_id,
            "status": {
                "$in": ["accepted", "confirmed"]
            }
        };
        let result = self.collection.find_one(filter).await?;
        Ok(result)
    }

    // /// Safely creates a payment with constraint checking
    // /// Returns an error if a payment with "accepted" or "confirmed" status already exists for the invoice
    // pub async fn create_with_constraint_check(&self, payment: &Payment) -> Result<(), String> {
    //     // Only check constraint for accepted or confirmed payments
    //     if matches!(payment.status, PaymentStatus::Accepted | PaymentStatus::Confirmed) {
    //         if let Ok(Some(_)) = self.find_accepted_or_confirmed_by_invoice(&payment.invoice_id).await {
    //             return Err("A payment for this invoice has already been accepted or confirmed".to_string());
    //         }
    //     }
        
    //     // Attempt to create the payment
    //     match self.create(payment).await {
    //         Ok(()) => Ok(()),
    //         Err(e) => {
    //             let error_msg = e.to_string();
    //             if error_msg.contains("duplicate key") || error_msg.contains("E11000") {
    //                 Err("A payment for this invoice has already been accepted or confirmed".to_string())
    //             } else {
    //                 Err(format!("Database error: {}", error_msg))
    //             }
    //         }
    //     }
    // }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{PaymentToken, PaymentStatus};
    use crate::database::MongoDBClient;
    use bson::oid::ObjectId;
    
    async fn setup_test_db() -> PaymentRepository {
        let mongodb_uri = std::env::var("MONGODB_TEST_URI")
            .unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
        let database_name = format!("test_db_{}", ObjectId::new());
        
        let client = MongoDBClient::new(&mongodb_uri, &database_name)
            .await
            .expect("Failed to connect to test MongoDB");
        
        let repo = PaymentRepository::new(client.get_database());
        repo.create_indexes().await.expect("Failed to create indexes");
        repo
    }
    
    #[tokio::test]
    async fn test_unique_payment_constraint() {
        let repo = setup_test_db().await;
        let invoice_id = ObjectId::new();
        
        // Create first accepted payment - should succeed
        let payment1 = Payment::new(invoice_id, PaymentToken::SBTC, 1000);
        let result1 = repo.create(&payment1).await;
        assert!(result1.is_ok(), "First payment should be created successfully");
        
        // Try to create second accepted payment for same invoice - should fail
        let payment2 = Payment::new(invoice_id, PaymentToken::SBTC, 2000);
        let result2 = repo.create(&payment2).await;
        assert!(result2.is_err(), "Second accepted payment should fail due to unique constraint");
        
        // Create a rejected payment for the same invoice - should succeed
        let mut payment3 = Payment::new(invoice_id, PaymentToken::SBTC, 3000);
        payment3.status = PaymentStatus::Rejected;
        let result3 = repo.create(&payment3).await;
        assert!(result3.is_ok(), "Rejected payment should be allowed");
        
        // Try to create confirmed payment for same invoice - should fail
        let mut payment4 = Payment::new(invoice_id, PaymentToken::SBTC, 4000);
        payment4.status = PaymentStatus::Confirmed;
        let result4 = repo.create(&payment4).await;
        assert!(result4.is_err(), "Confirmed payment should fail due to unique constraint with existing accepted payment");
        
        // Create accepted payment for different invoice - should succeed
        let different_invoice_id = ObjectId::new();
        let payment5 = Payment::new(different_invoice_id, PaymentToken::SBTC, 5000);
        let result5 = repo.create(&payment5).await;
        assert!(result5.is_ok(), "Payment for different invoice should succeed");
    }
}
