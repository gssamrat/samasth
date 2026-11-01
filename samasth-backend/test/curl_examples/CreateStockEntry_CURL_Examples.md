# CreateStockEntry API - CURL Examples

This document provides comprehensive CURL examples for testing the `CreateStockEntry` endpoint.

## Endpoint Information

- **URL**: `POST /api/v1/stock`
- **Content-Type**: `application/json`
- **Authentication**: Required (if implemented)

## CURL Examples

### 1. Successful Stock Entry Creation

```bash
curl -X POST http://localhost:8080/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "e_id": "E001",
    "s_id": "S001", 
    "mrp": 99.99,
    "purchase_price": 79.99,
    "stock_quantity": 100,
    "remarks": "Initial stock entry for Product A",
    "s_sale_value": 89.99,
    "s_place_id": "PLACE001",
    "batchno": "BATCH001",
    "manfacture_dt": "2025-09-01T00:00:00Z",
    "expirydt": "2026-09-01T00:00:00Z"
  }'
```

**Expected Response (201 Created):**
```json
{
  "message": "Stock entry created successfully",
  "stock_entry": {
    "es_id": "ES001",
    "es_e_id": "E001",
    "es_s_id": "S001",
    "es_mrp": 99.99,
    "es_purchase_price": 79.99,
    "es_stock_quantity": 100,
    "es_remarks": "Initial stock entry for Product A",
    "es_created_at": "2025-09-30T10:00:00Z",
    "updated_at": "2025-09-30T10:00:00Z",
    "entity": {
      "e_id": "E001",
      "e_barcode": "BC001",
      "e_name": "Product A"
    }
  }
}
```

### 2. Minimum Required Fields

```bash
curl -X POST http://localhost:8080/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "e_id": "E002",
    "s_id": "S002",
    "mrp": 49.99,
    "purchase_price": 39.99,
    "stock_quantity": 50,
    "s_sale_value": 44.99
  }'
```

### 3. Stock Entry with Batch Information

```bash
curl -X POST http://localhost:8080/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "e_id": "E003",
    "s_id": "S003",
    "mrp": 149.99,
    "purchase_price": 119.99,
    "stock_quantity": 25,
    "remarks": "Perishable goods with expiry tracking",
    "s_sale_value": 139.99,
    "s_place_id": "WAREHOUSE_A",
    "batchno": "BATCH_PER_001",
    "manfacture_dt": "2025-08-15T00:00:00Z",
    "expirydt": "2025-12-15T00:00:00Z"
  }'
```

### 4. High-Value Stock Entry

```bash
curl -X POST http://localhost:8080/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "e_id": "E004",
    "s_id": "S004",
    "mrp": 999.99,
    "purchase_price": 799.99,
    "stock_quantity": 10,
    "remarks": "High-value electronic item",
    "s_sale_value": 899.99,
    "s_place_id": "SECURE_STORAGE"
  }'
```

### 5. Bulk Stock Entry (Multiple Items)

```bash
# For Entity E005 - Product E
curl -X POST http://localhost:8080/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "e_id": "E005",
    "s_id": "S001",
    "mrp": 19.99,
    "purchase_price": 15.99,
    "stock_quantity": 500,
    "remarks": "Bulk purchase - Product E from Supplier 1",
    "s_sale_value": 17.99,
    "s_place_id": "MAIN_WAREHOUSE"
  }'

# For Entity E005 - Same product from different supplier
curl -X POST http://localhost:8080/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "e_id": "E005",
    "s_id": "S002",
    "mrp": 19.99,
    "purchase_price": 14.99,
    "stock_quantity": 300,
    "remarks": "Bulk purchase - Product E from Supplier 2 (better price)",
    "s_sale_value": 17.99,
    "s_place_id": "MAIN_WAREHOUSE"
  }'
```

## Error Test Cases

### 1. Missing Required Fields

```bash
curl -X POST http://localhost:8080/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mrp": 99.99,
    "purchase_price": 79.99,
    "stock_quantity": 100,
    "s_sale_value": 89.99
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Key: 'CreateEntitySupplierAndStockRequest.ESEID' Error:Tag 'required'"
}
```

### 2. Invalid JSON Format

```bash
curl -X POST http://localhost:8080/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "e_id": "E001",
    "s_id": "S001",
    "mrp": "invalid_number",
    "purchase_price": 79.99,
    "stock_quantity": 100,
    "s_sale_value": 89.99
  }'
```

### 3. Non-existent Entity or Supplier

```bash
curl -X POST http://localhost:8080/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "e_id": "INVALID_ENTITY",
    "s_id": "INVALID_SUPPLIER",
    "mrp": 99.99,
    "purchase_price": 79.99,
    "stock_quantity": 100,
    "s_sale_value": 89.99
  }'
```

**Expected Response (500 Internal Server Error):**
```json
{
  "error": "Failed to create Entity stock entry: entity not found"
}
```

## Testing with Different Environments

### Development Environment
```bash
export API_BASE_URL="http://localhost:8080"
export AUTH_TOKEN="dev_token_here"

curl -X POST $API_BASE_URL/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d @stock_entry_payload.json
```

### Staging Environment
```bash
export API_BASE_URL="https://staging-api.yourcompany.com"
export AUTH_TOKEN="staging_token_here"

curl -X POST $API_BASE_URL/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d @stock_entry_payload.json
```

### Production Environment
```bash
export API_BASE_URL="https://api.yourcompany.com"
export AUTH_TOKEN="production_token_here"

curl -X POST $API_BASE_URL/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d @stock_entry_payload.json
```

## Sample JSON Payloads

Create these files for easier testing:

### stock_entry_payload.json
```json
{
  "e_id": "E001",
  "s_id": "S001",
  "mrp": 99.99,
  "purchase_price": 79.99,
  "stock_quantity": 100,
  "remarks": "Standard stock entry",
  "s_sale_value": 89.99,
  "s_place_id": "MAIN_WAREHOUSE"
}
```

### stock_entry_with_batch.json
```json
{
  "e_id": "E002",
  "s_id": "S002",
  "mrp": 149.99,
  "purchase_price": 119.99,
  "stock_quantity": 25,
  "remarks": "Batch tracked item",
  "s_sale_value": 139.99,
  "s_place_id": "COLD_STORAGE",
  "batchno": "BATCH_2025_001",
  "manfacture_dt": "2025-09-01T00:00:00Z",
  "expirydt": "2026-03-01T00:00:00Z"
}
```

## Automated Testing Script

```bash
#!/bin/bash

# Test script for CreateStockEntry endpoint
API_BASE_URL="http://localhost:8080"
AUTH_TOKEN="your_token_here"

echo "Testing CreateStockEntry endpoint..."

# Test 1: Successful creation
echo "Test 1: Successful stock entry creation"
curl -X POST $API_BASE_URL/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "e_id": "E001",
    "s_id": "S001",
    "mrp": 99.99,
    "purchase_price": 79.99,
    "stock_quantity": 100,
    "remarks": "Test stock entry",
    "s_sale_value": 89.99
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 2: Missing required fields
echo "Test 2: Missing required fields"
curl -X POST $API_BASE_URL/api/v1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "mrp": 99.99,
    "purchase_price": 79.99,
    "stock_quantity": 100
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo "Testing completed!"
```

## Response Codes

- **201 Created**: Stock entry created successfully
- **400 Bad Request**: Invalid request payload or missing required fields
- **401 Unauthorized**: Invalid or missing authentication token
- **500 Internal Server Error**: Server error during processing

## Notes

1. Replace `YOUR_TOKEN_HERE` with actual authentication token
2. Adjust the base URL according to your environment
3. Ensure the referenced entity IDs and supplier IDs exist in the system
4. For batch tracking, both manufacture and expiry dates are optional
5. The `s_place_id` field is optional and can be used for inventory location tracking
