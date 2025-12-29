# VendHub Order Data Structure

This document describes the structure of order data from vending machine reports.

## Excel Report Headers

| Column (Russian) | Column (English) | Description |
|------------------|------------------|-------------|
| Номер заказа | Order Number | Unique order ID (hex format) |
| Номер оператора | Operator Number | Machine operator code |
| Наименование товара | Product Name | Product name (e.g., Cocoa, Americano) |
| Название вкуса | Flavor Name | Flavor variant (e.g., "Какао без сахара") |
| Ресурс заказа | Order Resource | Payment method (Оплата наличными, QR, VIP, etc.) |
| Тип заказа | Order Type | Order type (Обычный порядок) |
| Статус платежа | Payment Status | Payment status (Оплачено, etc.) |
| Тип чашки | Cup Type | Cup size/type (1, 2, etc.) |
| Машинный код | Machine Code | Unique machine identifier |
| Адрес | Address | Machine location |
| Цена заказа | Order Price | Price in UZS |
| Статус варки | Brewing Status | Delivery status (Доставлен) |
| Время создания | Created Time | Order creation timestamp |
| Время оплаты | Payment Time | Payment timestamp |
| Время заваривания | Brewing Time | Brewing start timestamp |
| Срок поставки | Delivery Time | Delivery completion timestamp |
| Время возврата денег | Refund Time | Refund timestamp (if applicable) |
| Платежная карта | Payment Card | Card identifier (for card payments) |
| Причина | Reason | Reason for refund/cancellation |
| Замечание | Notes | Additional notes |

## Payment Types (Ресурс заказа)

| Russian | English | Description |
|---------|---------|-------------|
| Оплата наличными | Cash Payment | Cash payment |
| QR платежи | QR Payments | QR code payment (Click, Payme, etc.) |
| VIP | VIP | VIP customer payment |
| Карты | Card | Card payment |
| testShipment | Test | Test order (free) |

## Order Statuses

| Status | Description |
|--------|-------------|
| Оплачено | Paid |
| Доставлен | Delivered |
| Возврат | Refunded |

## Sample Order

```json
{
  "orderNumber": "ff000008d82025122500145924a8181f0000",
  "operatorNumber": "G9982401B-1",
  "productName": "Cocoa",
  "flavorName": "Какао без сахара",
  "orderResource": "Оплата наличными",
  "orderType": "Обычный порядок",
  "paymentStatus": "Оплачено",
  "cupType": "1",
  "machineCode": "24a8181f0000",
  "address": "Parus F4",
  "orderPrice": 15000,
  "brewingStatus": "Доставлен",
  "createdTime": "2025-12-24 21:15:02",
  "paymentTime": "2025-12-24 21:15:02",
  "brewingTime": "2025-12-24 21:15:02",
  "deliveryTime": "2025-12-24 21:15:56"
}
```

## Integration Notes

The admin panel should support importing these Excel reports to:
1. Track sales by machine, product, and time period
2. Calculate revenue by payment type
3. Identify top-selling products
4. Monitor machine performance
5. Compare sales with inventory consumption
