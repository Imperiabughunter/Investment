import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { useInvestments } from '@/hooks';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function InvestmentDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const { useInvestmentDetails } = useInvestments();
  
  const { 
    data: investment, 
    isLoading, 
    refetch,
    isRefetching 
  } = useInvestmentDetails(id);

  const onRefresh = () => {
    refetch();
  };

  const progress = investment ? investment.currentDay / investment.duration : 0;
  
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
        <Text style={styles.headerTitle}>Investment Details</Text>
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
            <Text style={styles.loadingText}>Loading investment details...</Text>
          </View>
        ) : investment ? (
          <>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.planName}>{investment.planName}</Text>
                  <Text style={styles.investmentAmount}>{formatCurrency(investment.amount)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(investment.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(investment.status) }]}>
                    {investment.status}
                  </Text>
                </View>
              </View>
              
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressValue}>
                    {investment.currentDay} / {investment.duration} days
                  </Text>
                </View>
                <ProgressBar progress={progress} color="#2e86de" />
              </View>
              
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Start Date</Text>
                  <Text style={styles.detailValue}>{formatDate(investment.startDate)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>End Date</Text>
                  <Text style={styles.detailValue}>{formatDate(investment.endDate)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ROI</Text>
                  <Text style={styles.detailValue}>{investment.roi}%</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Risk Level</Text>
                  <Text style={styles.detailValue}>{investment.riskLevel}</Text>
                </View>
              </View>
            </Card>
            
            <Card style={styles.returnsCard}>
              <Text style={styles.sectionTitle}>Returns</Text>
              
              <View style={styles.returnsRow}>
                <View style={styles.returnItem}>
                  <Text style={styles.returnLabel}>Initial Investment</Text>
                  <Text style={styles.returnValue}>{formatCurrency(investment.amount)}</Text>
                </View>
                <View style={styles.returnItem}>
                  <Text style={styles.returnLabel}>Expected Return</Text>
                  <Text style={styles.returnValue}>{formatCurrency(investment.expectedReturn)}</Text>
                </View>
              </View>
              
              <View style={styles.returnsRow}>
                <View style={styles.returnItem}>
                  <Text style={styles.returnLabel}>Current Value</Text>
                  <Text style={styles.returnValue}>{formatCurrency(investment.currentValue)}</Text>
                </View>
                <View style={styles.returnItem}>
                  <Text style={styles.returnLabel}>Profit</Text>
                  <Text style={[styles.returnValue, { color: '#2ecc71' }]}>
                    +{formatCurrency(investment.currentValue - investment.amount)}
                  </Text>
                </View>
              </View>
            </Card>
            
            <Card style={styles.termsCard}>
              <Text style={styles.sectionTitle}>Terms & Conditions</Text>
              
              <View style={styles.termItem}>
                <Ionicons name="information-circle-outline" size={20} color="#7f8c8d" style={styles.termIcon} />
                <Text style={styles.termText}>Early withdrawal may result in penalties.</Text>
              </View>
              
              <View style={styles.termItem}>
                <Ionicons name="information-circle-outline" size={20} color="#7f8c8d" style={styles.termIcon} />
                <Text style={styles.termText}>Returns are calculated daily and paid at maturity.</Text>
              </View>
              
              <View style={styles.termItem}>
                <Ionicons name="information-circle-outline" size={20} color="#7f8c8d" style={styles.termIcon} />
                <Text style={styles.termText}>Investment is automatically renewed unless canceled 7 days before maturity.</Text>
              </View>
            </Card>
            
            {investment.status === 'Active' && (
              <TouchableOpacity style={styles.withdrawButton}>
                <Text style={styles.withdrawButtonText}>Request Early Withdrawal</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
            <Text style={styles.errorText}>Investment not found</Text>
            <TouchableOpacity 
              style={styles.backToInvestmentsButton}
              onPress={() => router.replace('/investments')}
            >
              <Text style={styles.backToInvestmentsText}>Back to Investments</Text>
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
    case 'Cancelled':
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
  investmentAmount: {
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
  returnsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  returnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  returnItem: {
    width: '48%',
  },
  returnLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  returnValue: {
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
  withdrawButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  withdrawButtonText: {
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
  backToInvestmentsButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  backToInvestmentsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },