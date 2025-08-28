// src/database/repositories/invoice_repository.rs
use mongodb::{Collection, Database, bson::doc};
use futures::stream::TryStreamExt;
use anyhow::Result;
use bson;
use crate::models::Invoice;

#[derive(Clone)]
pub struct InvoiceRepository {
    collection: Collection<Invoice>,
}

impl InvoiceRepository {
    pub fn new(database: &Database) -> Self {
        let collection = database.collection::<Invoice>("invoices");
        Self { collection }
    }

    pub async fn create(&self, invoice: &Invoice) -> Result<()> {
        self.collection.insert_one(invoice).await?;
        Ok(())
    }

    pub async fn find_by_id(&self, invoice_id: &bson::oid::ObjectId) -> Result<Option<Invoice>> {
        let filter = doc! { "_id": invoice_id };
        let result = self.collection.find_one(filter).await?;
        Ok(result)
    }

    pub async fn find_by_merchant(&self, wallet_address: &str) -> Result<Vec<Invoice>> {
        let filter = doc! { "wallet_address": wallet_address };
        let mut cursor = self.collection.find(filter).await?;
        let mut invoices = Vec::new();
        
        while let Some(invoice) = cursor.try_next().await? {
            invoices.push(invoice);
        }
        
        Ok(invoices)
    }

    pub async fn update_status(&self, invoice_id: &str, status: crate::models::InvoiceStatus) -> Result<bool> {
        let filter = doc! { "invoice_id": invoice_id };
        let update = doc! { "$set": { "status": bson::to_bson(&status)? } };
        
        let result = self.collection.update_one(filter, update).await?;
        Ok(result.modified_count > 0)
    }
}
