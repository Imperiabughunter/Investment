import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLoans } from '@/hooks';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Dialog } from '@/components/Dialog';

export default function Loans() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('products');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTerm, setLoanTerm] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  
  // Fetch data using React Query hooks
  const { 
    useLoanProducts, 
    useUserLoans, 
    useApplyForLoan,
    useCalculateLoanDetails
  } = useLoans();
  
  const { 
    data: products, 
    isLoading: isProductsLoading, 
    refetch: refetchProducts,
    isRefetching: isProductsRefetching 
  } = useLoanProducts();
  
  const { 
    data: userLoans, 
    isLoading: isLoansLoading,
    refetch: refetchLoans,
    isRefetching: isLoansRefetching 
  } = useUserLoans();

  const applyForLoan = useApplyForLoan();
  const calculateLoan = useCalculateLoanDetails();

  const isLoading = isProductsLoading || isLoansLoading;
  const isRefetching = isProductsRefetching || isLoansRefetching;

  const onRefresh = () => {
    refetchProducts();
    refetchLoans();
  };

  const handleLoanApplication = async () => {
    if (!selectedProduct || !loanAmount || !loanTerm || !loanPurpose) return;
    
    try {
      await applyForLoan.mutateAsync({
        productId: selectedProduct.id,
        amount: parseFloat(loanAmount),
        termMonths: parseInt(loanTerm),
        purpose: loanPurpose
      });
      
      setShowApplyDialog(false);
      setSelectedProduct(null);
      setLoanAmount('');
      setLoanTerm('');
      setLoanPurpose('');
      onRefresh();
    } catch (error) {
      console.error('Failed to apply for loan:', error);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setShowApplyDialog(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loans</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'products' && styles.activeTabButton]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'products' && styles.activeTabButtonText]}>Loan Products</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'my' && styles.activeTabButton]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'my' && styles.activeTabButtonText]}>My Loans</Text>
        </TouchableOpacity>
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
            <ActivityIndicator size="large" color="#FF7B00" />
            <Text style={styles.loadingText}>Loading loans...</Text>
          </View>
        ) : activeTab === 'products' ? (
          <View>
            <Text style={styles.sectionTitle}>Available Loan Products</Text>
            {products?.map((product) => (
              <LoanProductCard 
                key={product.id} 
                product={product} 
                onPress={() => handleProductSelect(product)} 
              />
            ))}
          </View>
        ) : (
          <View>
            {userLoans?.length > 0 ? (
              userLoans.map((loan) => (
                <LoanCard 
                  key={loan.id} 
                  loan={loan} 
                  onPress={() => router.push(`/loans/${loan.id}`)} 
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="card-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>You don't have any active loans</Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => setActiveTab('products')}
                >
                  <Text style={styles.emptyButtonText}>Explore Loan Products</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      
      <Dialog 
        visible={showApplyDialog}
        title="Apply for Loan"
        onClose={() => setShowApplyDialog(false)}
        actions={[
          { 
            label: 'Cancel', 
            onPress: () => setShowApplyDialog(false) 
          },
          { 
            label: 'Apply', 
            onPress: handleLoanApplication,
            primary: true,
            disabled: applyForLoan.isPending
          }
        ]}
      >
        {selectedProduct && (
          <View style={styles.dialogContent}>
            <Text style={styles.dialogLabel}>Loan Product</Text>
            <Text style={styles.dialogProductName}>{selectedProduct.name}</Text>
            <Text style={styles.dialogProductDetails}>
              {selectedProduct.interestRate}% interest • {selectedProduct.maxTermMonths} months max
            </Text>
            
            <Text style={[styles.dialogLabel, { marginTop: 16 }]}>Loan Amount</Text>
            <View style={styles.dialogInputContainer}>
              <Text style={styles.dialogInputPrefix}>$</Text>
              <TextInput
                style={styles.dialogInput}
                value={loanAmount}
                onChangeText={setLoanAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
              />
            </View>
            
            <Text style={[styles.dialogLabel, { marginTop: 12 }]}>Loan Term (months)</Text>
            <View style={styles.dialogInputContainer}>
              <TextInput
                style={styles.dialogInput}
                value={loanTerm}
                onChangeText={setLoanTerm}
                keyboardType="numeric"
                placeholder="Enter term in months"
              />
            </View>
            
            <Text style={[styles.dialogLabel, { marginTop: 12 }]}>Purpose</Text>
            <View style={styles.dialogInputContainer}>
              <TextInput
                style={styles.dialogInput}
                value={loanPurpose}
                onChangeText={setLoanPurpose}
                placeholder="Enter loan purpose"
              />
            </View>
            
            {selectedProduct.minAmount && (
              <Text style={styles.dialogMinAmount}>
                Loan range: {formatCurrency(selectedProduct.minAmount)} - {formatCurrency(selectedProduct.maxAmount)}
              </Text>
            )}
            
            {loanAmount && loanTerm && (
              <View style={styles.dialogSummary}>
                <Text style={styles.dialogSummaryLabel}>Monthly Payment (est.)</Text>
                <Text style={styles.dialogSummaryValue}>
                  {formatCurrency((parseFloat(loanAmount) * (1 + selectedProduct.interestRate / 100)) / parseInt(loanTerm))}
                </Text>
                <Text style={styles.dialogSummaryTotal}>
                  Total repayment: {formatCurrency(parseFloat(loanAmount) * (1 + selectedProduct.interestRate / 100))}
                </Text>
              </View>
            )}
          </View>
        )}
      </Dialog>
    </SafeAreaView>
  );
}

function LoanProductCard({ product, onPress }) {
  return (
    <Card style={styles.productCard}>
      <View style={styles.productHeader}>
        <View>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription}>{product.description}</Text>
        </View>
        <View style={styles.rateBadge}>
          <Text style={styles.rateText}>{product.interestRate}%</Text>
        </View>
      </View>
      
      <View style={styles.productDetails}>
        <View style={styles.productDetailItem}>
          <Text style={styles.productDetailLabel}>Max Term</Text>
          <Text style={styles.productDetailValue}>{product.maxTermMonths} months</Text>
        </View>
        <View style={styles.productDetailItem}>
          <Text style={styles.productDetailLabel}>Loan Range</Text>
          <Text style={styles.productDetailValue}>
            {formatCurrency(product.minAmount)} - {formatCurrency(product.maxAmount)}
          </Text>
        </View>
        <View style={styles.productDetailItem}>
          <Text style={styles.productDetailLabel}>Processing Fee</Text>
          <Text style={styles.productDetailValue}>{product.processingFee}%</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.applyButton} onPress={onPress}>
        <Text style={styles.applyButtonText}>Apply Now</Text>
      </TouchableOpacity>
    </Card>
  );
}

function LoanCard({ loan, onPress }) {
  const progress = loan.paidAmount / loan.totalAmount;
  
  return (
    <Card style={styles.loanCard} onPress={onPress}>
      <View style={styles.loanHeader}>
        <View>
          <Text style={styles.loanProductName}>{loan.productName}</Text>
          <Text style={styles.loanAmount}>{formatCurrency(loan.amount)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(loan.status) }]}>
            {loan.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.loanProgress}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Repayment Progress</Text>
          <Text style={styles.progressValue}>
            {formatCurrency(loan.paidAmount)} / {formatCurrency(loan.totalAmount)}
          </Text>
        </View>
        <ProgressBar progress={progress} color="#FF7B00" />
      </View>
      
      <View style={styles.loanDetails}>
        <View style={styles.loanDetailItem}>
          <Text style={styles.loanDetailLabel}>Next Payment</Text>
          <Text style={styles.loanDetailValue}>{formatDate(loan.nextPaymentDate)}</Text>
        </View>
        <View style={styles.loanDetailItem}>
          <Text style={styles.loanDetailLabel}>Monthly Payment</Text>
          <Text style={styles.loanDetailValue}>{formatCurrency(loan.monthlyPayment)}</Text>
        </View>
        <View style={styles.loanDetailItem}>
          <Text style={styles.loanDetailLabel}>Remaining</Text>
          <Text style={styles.loanDetailValue}>{loan.remainingMonths} months</Text>
        </View>
      </View>
    </Card>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'Active':
      return '#FF7B00';
    case 'Approved':
      return '#2ecc71';
    case 'Pending':
      return '#3498db';
    case 'Rejected':
      return '#e74c3c';
    case 'Completed':
      return '#2ecc71';
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
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f6fa',
  },
  activeTabButton: {
    backgroundColor: '#FF7B00',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
  },
  productCard: {
    marginBottom: 16,
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  rateBadge: {
    backgroundColor: '#FF7B00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rateText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  productDetailItem: {
    flex: 1,
  },
  productDetailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  productDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  applyButton: {
    backgroundColor: '#FF7B00',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loanCard: {
    marginBottom: 16,
    padding: 16,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanProductName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  loanAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  loanProgress: {
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
    fontWeight: '500',
    color: '#2c3e50',
  },
  loanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  loanDetailItem: {
    flex: 1,
  },
  loanDetailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  loanDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#FF7B00',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dialogContent: {
    padding: 16,
  },
  dialogLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  dialogProductName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  dialogProductDetails: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  dialogInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  dialogInputPrefix: {
    fontSize: 16,
    color: '#7f8c8d',
    marginRight: 8,
  },
  dialogInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  dialogMinAmount: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  dialogSummary: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f5f6fa',
    borderRadius: 8,
  },
  dialogSummaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  dialogSummaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  dialogSummaryTotal: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});