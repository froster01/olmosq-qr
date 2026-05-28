# PRD: QR Ordering System With Loyverse Receipt Sync

## 1. Summary

This document describes a QR ordering system for a cafe that sells drinks and food. Customers scan a table QR code, place an order, check the total price, and submit it.

The system will use Next.js as the live order system. Loyverse POS will be used for menu data, payment types, inventory updates, final sales receipts, and reports.

## 2. Contacts

| Name | Role | Comment |
| --- | --- | --- |
| Cafe owner | Product owner | Owns the cafe workflow and final business decisions. |
| Cafe staff | Daily users | Accept orders, prepare items, collect payment, and sync paid orders to Loyverse. |
| Developer | Builder | Builds the Next.js app and Loyverse API integration. |
| Loyverse support/docs | External dependency | Provides API behavior, limits, and payment/receipt rules. |

## 3. Background

The cafe currently uses Loyverse POS on an Android tablet. Staff use it to manage sales, payments, inventory, and reports.

The cafe wants a QR ordering system so customers can order from their table without waiting for staff to take the order. This should reduce manual order taking and make the order flow faster.

Loyverse Open Tickets are useful inside the Loyverse POS app, but the public Loyverse API is focused on receipts and other synced data. For this MVP, the QR system will not create unpaid Loyverse Open Tickets. Instead, the QR system will hold live orders in Next.js. After staff receives payment, the system will create a completed Loyverse receipt by API.

Reference docs:

- [Loyverse API reference](https://developer.loyverse.com/docs//1000)
- [Loyverse payment types](https://help.loyverse.com/help/configuring-payment-types-loyverse)
- [Loyverse Open Tickets](https://help.loyverse.com/help/open-tickets)

## 4. Objective

The objective is to let customers place dine-in table orders by QR code, while keeping Loyverse as the final POS record for paid sales.

This matters because the cafe can receive orders faster, reduce staff typing, reduce order mistakes, and keep inventory and sales reports inside Loyverse.

### Key Results

| Key Result | Target |
| --- | --- |
| Reduce manual order taking | At least 60% of dine-in orders come from QR within 3 months of launch. |
| Reduce order mistakes | Fewer than 2 wrong-item issues per 100 QR orders. |
| Keep Loyverse reports useful | 100% of paid QR orders sync to Loyverse receipts or show a retry error. |
| Speed up service | Staff can move an order from new to accepted in under 30 seconds. |
| Keep customer flow simple | Customer can submit an order in 5 steps or fewer after scanning the QR code. |

## 5. Market Segments

### Primary Segment: Dine-In Cafe Customers

These customers sit at a table and want to order drinks or food without waiting for staff. They need a fast mobile menu, clear prices, and a simple way to submit the order.

Constraints:

- They may use different phone sizes.
- They may not want to create an account.
- They need to see the total price before submitting.
- They may not understand POS terms.

### Secondary Segment: Cafe Staff

Staff need to receive orders clearly, prepare them, collect payment, and record the final sale in Loyverse.

Constraints:

- They are busy during peak hours.
- They need table number, customer name, item list, and total price at a glance.
- They should not need to type the same order again in Loyverse.

### Business Segment: Cafe Owner

The owner needs faster operations, cleaner reports, and accurate inventory.

Constraints:

- Loyverse must remain the trusted source for sales reports and inventory.
- The system should be simple enough for staff to learn quickly.
- The MVP should avoid complex payment gateway work.

## 6. Value Propositions

### For Customers

- Order from the table without waiting.
- See item prices and total before submitting.
- Avoid unclear verbal orders.
- Use a simple phone-based menu without account signup.

### For Staff

- See new orders in one dashboard.
- Know the table number, customer name, and order details.
- Select the payment type after payment is received.
- Send the paid sale to Loyverse without re-keying the whole order.

### For Cafe Owner

- Keep Loyverse as the final sales and reporting system.
- Reduce order-taking workload.
- Reduce mistakes from handwritten or spoken orders.
- Keep an upgrade path for online payment, takeaway, and loyalty later.

## 7. Solution

### 7.1 UX And User Flows

#### Customer Flow

1. Customer scans the QR code at the table.
2. Customer enters their name.
3. Customer browses food and drink items synced from Loyverse.
4. Customer adds items, quantities, modifiers, and optional item notes.
5. Customer reviews the cart total.
6. Customer submits the order.
7. Customer sees an order confirmation with order number and table number.

#### Staff Flow

1. Staff opens the Next.js staff dashboard.
2. Staff sees new orders by table, customer name, time, and total.
3. Staff accepts the order.
4. Staff marks the order as preparing.
5. Staff marks the order as awaiting payment when ready.
6. Staff collects payment by cash, card, QR, or another configured Loyverse payment type.
7. Staff selects that payment type in Next.js.
8. Next.js creates a Loyverse receipt.
9. Staff sees the order marked as synced, with the Loyverse receipt number.

### 7.2 Key Features

#### Customer QR Ordering

- Each table has a unique QR code.
- The QR code opens `/table/[tableCode]`.
- Customer name is required.
- Phone number is not required in MVP.
- Customer can add items to cart and review total before submit.
- Customer cannot pay online in MVP.

#### Menu Sync From Loyverse

- Sync item names, prices, categories, variants, modifiers, taxes, stores, and availability where supported by the Loyverse API.
- Loyverse is the source of truth for menu prices.
- The QR app should not let staff change item prices directly in MVP.
- If an item is deleted or unavailable in Loyverse, it should not be orderable after sync.

#### Staff Order Dashboard

- Staff can view live QR orders.
- Staff can filter by status.
- Staff can open order details.
- Staff can update order status.
- Staff can cancel unpaid orders.
- Staff can retry Loyverse sync when receipt creation fails.

#### Payment Type Selection

- Staff selects one payment type after receiving payment.
- Payment types come from Loyverse.
- MVP supports one payment type per receipt.
- Split payment is not supported in MVP.
- QR payment means staff has already confirmed the QR payment outside the customer QR flow.

#### Loyverse Receipt Sync

- Next.js creates a Loyverse receipt only after staff confirms payment.
- Receipt `order` field should use this format: `QR-{orderNumber} / Table {tableNumber}`.
- Receipt `note` field should use this format: `Customer: {customerName}`.
- Receipt line items should include Loyverse variant IDs, quantities, modifiers, item notes, taxes, and prices when needed.
- Receipt payment should include one `payment_type_id`.
- The app must store the Loyverse receipt number after successful sync.
- If sync fails, the paid order must stay in the dashboard with a retry state.

#### Order Status Flow

```text
pending
accepted
preparing
awaiting_payment
paid_syncing
paid_synced_to_loyverse
paid_sync_failed
cancelled
```

Status meanings:

- `pending`: Customer submitted the order.
- `accepted`: Staff accepted the order.
- `preparing`: Kitchen or bar is preparing the order.
- `awaiting_payment`: Order is ready for payment.
- `paid_syncing`: Staff selected payment type and the app is creating the Loyverse receipt.
- `paid_synced_to_loyverse`: Loyverse receipt was created successfully.
- `paid_sync_failed`: Payment was marked received, but Loyverse sync failed.
- `cancelled`: Order was cancelled before payment.

### 7.3 Technology

#### App Stack

- Next.js full-stack app.
- Database for tables, synced menu data, orders, order items, order status, and Loyverse sync logs.
- Server-side API routes or server actions for order submission, staff actions, menu sync, and receipt sync.
- Mobile-first customer UI.
- Staff dashboard for tablet or desktop use.

#### Loyverse API Use

- Read stores.
- Read items, categories, variants, modifiers, taxes, and inventory where needed.
- Read payment types.
- Create receipts after payment.
- Store API tokens securely on the server only.

#### Suggested Routes

Customer routes:

- `/table/[tableCode]`
- `/order/[orderId]/confirmation`

Staff routes:

- `/staff/orders`
- `/staff/orders/[orderId]`
- `/staff/menu-sync`
- `/staff/tables`

Backend routes or actions:

- Submit customer order.
- Update order status.
- Sync Loyverse menu data.
- Sync Loyverse payment types.
- Create Loyverse receipt.
- Retry failed Loyverse receipt sync.

### 7.4 Assumptions

- Version 1 supports dine-in table ordering only.
- Payment is handled outside the customer QR flow.
- Staff confirms payment before syncing to Loyverse.
- Next.js is the live order system.
- Loyverse receives only completed paid receipts.
- Loyverse Open Tickets are out of MVP.
- One receipt has one payment type in MVP.
- Staff can manually verify QR payments before selecting QR as the payment type.
- Future versions may add online payment, takeaway, kitchen printing, loyalty, customer order history, and Open Ticket automation research.

## 8. Release

### MVP Release

Expected effort: 4 to 8 weeks, depending on Loyverse API setup, menu complexity, and staff dashboard design.

MVP includes:

- Table QR code setup.
- Customer order page.
- Customer name capture.
- Menu display from Loyverse sync.
- Cart and total review.
- Order submission.
- Staff order dashboard.
- Status updates.
- Loyverse payment type sync.
- Staff payment type selection.
- Loyverse receipt creation after payment.
- Failed sync retry.
- Basic mobile and tablet responsive design.

### Future Releases

Future version ideas:

- Online payment before order submit.
- Takeaway orders.
- Customer order history.
- Kitchen display screen.
- Kitchen or receipt printer integration.
- Stock warnings before customer submits.
- Menu photos and QR-only display labels.
- Loyalty/customer profile connection.
- Multi-language menu.
- Open Ticket automation research if Loyverse or a bridge later supports it.

## Acceptance Criteria

- Customer can place an order from a table QR code.
- Customer must enter name before submitting.
- Customer sees item prices, quantity, subtotal, and total before submitting.
- Staff can see submitted orders in the dashboard.
- Staff can move orders through the full MVP status flow.
- Staff can select exactly one payment type after payment.
- App creates a Loyverse receipt only after payment is confirmed.
- Loyverse receipt includes correct items, quantities, modifiers, table/order reference, customer name note, and payment type.
- Successful sync stores the Loyverse receipt number.
- Failed sync does not delete the order and can be retried.
- Split payment is hidden or blocked in MVP.
- Customer UI works well on common mobile screen sizes.

