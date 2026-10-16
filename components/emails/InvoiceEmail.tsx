import React from 'react';
import {
  Html,
  Body,
  Head,
  Heading,
  Container,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from '@react-email/components';

export interface InvoiceEmailProps {
  transactionId: string;
  receiptNumber?: string;
  customerName?: string;
  date: string;
  amount: number;
  wingitsCredited: number;
  purchaseType?: 'wingits' | 'secret_wingle';
}

export const InvoiceEmail: React.FC<InvoiceEmailProps> = ({
  transactionId,
  receiptNumber,
  customerName,
  date,
  amount,
  wingitsCredited,
  purchaseType = 'wingits',
}) => {
  const isSecretWingle = purchaseType === 'secret_wingle';
  const paidAmount = `LKR ${new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
  const paidAt = new Date(date);
  const formattedDate = Number.isNaN(paidAt.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Colombo',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(paidAt) + ' (Sri Lanka, UTC+05:30)';

  return (
    <Html lang="en">
      <Head />
      <Preview>Payment received: {paidAmount}. Your Wingle Mingle receipt.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandHeader}>
            <Heading style={brandName}>Wingle Mingle</Heading>
            <Text style={brandCaption}>A little connection goes a long way.</Text>
          </Section>

          <Section style={content}>
            <Text style={paidBadge}>PAID</Text>
            <Heading as="h2" style={heading}>Your payment receipt</Heading>
            <Text style={intro}>
              {customerName?.trim() ? `Hi ${customerName.trim()}, thank you for your purchase.` : 'Thank you for your purchase.'}
              {' '}Your payment was successful.
            </Text>

            <Section style={detailsBox}>
              {customerName?.trim() && (
                <>
                  <Text style={detailLabel}>Purchased by</Text>
                  <Text style={detailValue}>{customerName.trim()}</Text>
                </>
              )}
              <Text style={detailLabel}>Receipt number</Text>
              <Text style={detailValue}>{receiptNumber || transactionId}</Text>
              <Text style={detailLabel}>Gateway transaction ID</Text>
              <Text style={detailValue}>{transactionId}</Text>
              <Text style={detailLabel}>Payment date &amp; time</Text>
              <Text style={lastDetailValue}>{formattedDate}</Text>
            </Section>

            <Row style={itemHeader}>
              <Column><Text style={tableLabel}>PURCHASE</Text></Column>
              <Column align="right"><Text style={tableLabel}>AMOUNT</Text></Column>
            </Row>
            <Row>
              <Column style={itemColumn}>
                <Text style={itemName}>{isSecretWingle ? 'Secret Wingle' : 'Wingits purchase'}</Text>
                <Text style={itemDescription}>
                  {isSecretWingle
                    ? `+${wingitsCredited} Wingits sender bonus`
                    : `${wingitsCredited} Wingits credited to your account`}
                </Text>
              </Column>
              <Column align="right" style={amountColumn}>
                <Text style={itemAmount}>{paidAmount}</Text>
              </Column>
            </Row>
            <Hr style={divider} />
            <Row>
              <Column><Text style={totalLabel}>Total paid</Text></Column>
              <Column align="right"><Text style={totalAmount}>{paidAmount}</Text></Column>
            </Row>

            <Text style={recordNote}>Keep this receipt for your records.</Text>
          </Section>

          <Section style={footerSection}>
            <Text style={footer}>Wingle Mingle · Sri Lanka</Text>
            <Text style={footerNote}>This receipt confirms your payment.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main: React.CSSProperties = {
  backgroundColor: '#f8f5f7',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
  margin: '0',
  padding: '28px 12px',
  color: '#172033',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  border: '1px solid #eee3e9',
  borderRadius: '12px',
  overflow: 'hidden',
  maxWidth: '600px',
};

const brandHeader: React.CSSProperties = {
  backgroundColor: '#fff1f7',
  borderTop: '5px solid #db2777',
  padding: '28px 28px 24px',
  textAlign: 'center',
};

const brandName: React.CSSProperties = {
  color: '#db2777',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '34px',
  margin: '0',
};

const brandCaption: React.CSSProperties = {
  color: '#6b4055',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '7px 0 0',
};

const content: React.CSSProperties = { padding: '28px' };

const paidBadge: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#dcfce7',
  color: '#166534',
  borderRadius: '20px',
  padding: '5px 12px',
  fontSize: '11px',
  fontWeight: '700',
  lineHeight: '16px',
  letterSpacing: '1px',
  margin: '0 0 12px',
};

const heading: React.CSSProperties = {
  color: '#172033',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '30px',
  margin: '0 0 12px',
};

const intro: React.CSSProperties = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 24px',
};

const detailsBox: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '18px',
  margin: '0 0 24px',
};

const detailLabel: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '11px',
  fontWeight: '600',
  lineHeight: '16px',
  margin: '0 0 3px',
};

const detailValue: React.CSSProperties = {
  color: '#172033',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 14px',
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
};

const lastDetailValue: React.CSSProperties = { ...detailValue, margin: '0' };

const itemHeader: React.CSSProperties = { borderBottom: '1px solid #e5e7eb' };

const tableLabel: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '10px',
  fontWeight: '700',
  letterSpacing: '0.8px',
  lineHeight: '16px',
  margin: '0 0 10px',
};

const itemColumn: React.CSSProperties = { padding: '16px 12px 0 0', verticalAlign: 'top' };

const itemName: React.CSSProperties = {
  color: '#172033',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '21px',
  margin: '0 0 4px',
};

const itemDescription: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '19px',
  margin: '0',
};

const amountColumn: React.CSSProperties = { paddingTop: '16px', verticalAlign: 'top', whiteSpace: 'nowrap' };

const itemAmount: React.CSSProperties = { ...itemName, margin: '0' };

const divider: React.CSSProperties = { borderColor: '#e5e7eb', margin: '20px 0 16px' };

const totalLabel: React.CSSProperties = { ...itemName, margin: '0', fontSize: '15px' };

const totalAmount: React.CSSProperties = {
  color: '#db2777',
  fontSize: '22px',
  fontWeight: '700',
  lineHeight: '28px',
  margin: '0',
  whiteSpace: 'nowrap',
};

const recordNote: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '24px 0 0',
};

const footerSection: React.CSSProperties = {
  backgroundColor: '#faf7f9',
  borderTop: '1px solid #eee3e9',
  padding: '18px 28px',
  textAlign: 'center',
};

const footer: React.CSSProperties = {
  color: '#6b4055',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
};

const footerNote: React.CSSProperties = { ...footer, color: '#6b7280', fontSize: '11px', margin: '3px 0 0' };

export default InvoiceEmail;
