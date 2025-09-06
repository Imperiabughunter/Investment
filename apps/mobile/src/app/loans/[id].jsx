import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { useLoans } from '@/hooks';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function LoanDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const { useLoanDetails } = useLoans();
  
  const { 
    data: loan, 
    isLoading, 
    refetch,
    isRefetching 
  } = useLoanDetails(id);

  const onRefresh = () => {
    refetch();
  };

  const progress = loan ? loan.amountPaid / loan.amount : 0;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Details</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2e86de" />
            <Text style={styles.loadingText}>Loading loan details...</Text>
          </View>
        ) : loan ? (
          <>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.planName}>{loan.productName}</Text>
                  <Text style={styles.loanAmount}>{formatCurrency(loan.amount)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(loan.status) }]}>
                    {loan.status}
                  </Text>
                </View>
              </View>
              
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Repayment Progress</Text>
                  <Text style={styles.progressValue}>
                    {formatCurrency(loan.amountPaid)} / {formatCurrency(loan.amount)}
                  </Text>
                </View>
                <ProgressBar progress={progress} color="#2e86de" />
              </View>
              
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Disbursement Date</Text>
                  <Text style={styles.detailValue}>{formatDate(loan.startDate)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={styles.detailValue}>{formatDate(loan.dueDate)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Interest Rate</Text>
                  <Text style={styles.detailValue}>{loan.interestRate}%</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Term</Text>
                  <Text style={styles.detailValue}>{loan.term} months</Text>
                </View>
              </View>
            </Card>
            
            <Card style={styles.paymentsCard}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              
              <View style={styles.paymentRow}>
                <View style={styles.paymentItem}>
                  <Text style={styles.paymentLabel}>Principal Amount</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(loan.amount)}</Text>
                </View>
                <View style={styles.paymentItem}>
                  <Text style={styles.paymentLabel}>Interest Amount</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(loan.interestAmount)}</Text>
                </View>
              </View>
              
              <View style={styles.paymentRow}>
                <View style={styles.paymentItem}>
                  <Text style={styles.paymentLabel}>Total Repayment</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(loan.totalRepayment)}</Text>
                </View>
                <View style={styles.paymentItem}>
                  <Text style={styles.paymentLabel}>Monthly Payment</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(loan.monthlyPayment)}</Text>
                </View>
              </View>
              
              <View style={styles.paymentRow}>
                <View style={styles.paymentItem}>
                  <Text style={styles.paymentLabel}>Amount Paid</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(loan.amountPaid)}</Text>
                </View>
                <View style={styles.paymentItem}>
                  <Text style={styles.paymentLabel}>Remaining Balance</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(loan.remainingBalance)}</Text>
                </View>
              </View>
            </Card>
            
            <Card style={styles.termsCard}>
              <Text style={styles.sectionTitle}>Terms & Conditions</Text>
              
              <View style={styles.termItem}>
                <Ionicons name="information-circle-outline" size={20} color="#7f8c8d" style={styles.termIcon} />
                <Text style={styles.termText}>Late payments may incur additional fees.</Text>
              </View>
              
              <View style={styles.termItem}>
                <Ionicons name="information-circle-outline" size={20} color="#7f8c8d" style={styles.termIcon} />
                <Text style={styles.termText}>Early repayment is allowed without penalties.</Text>
              </View>
              
              <View style={styles.termItem}>
                <Ionicons name="information-circle-outline" size={20} color="#7f8c8d" style={styles.termIcon} />
                <Text style={styles.termText}>Missed payments may affect your credit score.</Text>
              </View>
            </Card>
            
            {loan.status === 'Active' && (
              <TouchableOpacity style={styles.payButton}>
                <Text style={styles.payButtonText}>Make a Payment</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
            <Text style={styles.errorText}>Loan not found</Text>
            <TouchableOpacity 
              style={styles.backToLoansButton}
              onPress={() => router.replace('/loans')}
            >
              <Text style={styles.backToLoansText}>Back to Loans</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'Active':
      return '#2ecc71';
    case 'Completed':
      return '#3498db';
    case 'Approved':
      return '#f39c12';
    case 'Pending':
      return '#e67e22';
    case 'Rejected':
      return '#e74c3c';
    default:
      return '#7f8c8d';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  loanAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  detailItem: {
    width: '50%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  paymentsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  paymentItem: {
    width: '48%',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  termsCard: {
    marginBottom: 16,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  termIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  termText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  payButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 24,
  },
  backToLoansButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  backToLoansText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}