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
} from '@react-email/components';

interface InvoiceEmailProps {
  transactionId: string;
  date: string;
  amount: number;
  wingitsCredited: number;
}

export const InvoiceEmail: React.FC<InvoiceEmailProps> = ({
  transactionId,
  date,
  amount,
  wingitsCredited,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Your Wingle Mingle Invoice / Receipt</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Wingle Mingle</Heading>
          <Hr style={hr} />
          
          <Section style={section}>
            <Text style={text}>
              Thank you for your purchase! Your payment was successful and your Wingits have been credited to your account.
            </Text>
            
            <div style={detailsBox}>
              <Text style={boldText}>Invoice / Receipt Details:</Text>
              <Text style={detailRow}><strong>Receipt Number:</strong> {transactionId}</Text>
              <Text style={detailRow}><strong>Date & Time:</strong> {new Date(date).toLocaleString()}</Text>
              <Text style={detailRow}><strong>Amount Paid:</strong> Rs. {amount.toFixed(2)}</Text>
              <Text style={detailRow}><strong>Wingits Credited:</strong> {wingitsCredited}</Text>
            </div>
            
            <Text style={text}>
              If you have any questions about this receipt, simply reply to this email or reach out to our support team for help.
            </Text>
          </Section>
          
          <Hr style={hr} />
          <Text style={footer}>
            Wingle Mingle, Sri Lanka
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
  maxWidth: '600px',
};

const h1 = {
  color: '#db2777', // brand color
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const section = {
  padding: '0 20px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
};

const boldText = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '10px',
};

const detailsBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '20px',
  margin: '20px 0',
};

const detailRow = {
  color: '#4b5563',
  fontSize: '15px',
  margin: '5px 0',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '20px',
};

export default InvoiceEmail;
