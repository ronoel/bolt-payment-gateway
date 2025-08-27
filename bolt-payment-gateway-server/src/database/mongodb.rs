// src/database/mongodb.rs
use mongodb::{Client, Database};
use anyhow::Result;

#[derive(Clone)]
pub struct MongoDBClient {
    pub database: Database,
}

impl MongoDBClient {
    pub async fn new(connection_string: &str, database_name: &str) -> Result<Self> {
        let client = Client::with_uri_str(connection_string).await?;
        let database = client.database(database_name);
        
        Ok(Self { database })
    }

    pub fn get_database(&self) -> &Database {
        &self.database
    }
}
