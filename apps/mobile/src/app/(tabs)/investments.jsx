import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useInvestments } from '@/hooks';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Dialog } from '@/components/Dialog';

export default function Investments() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [showInvestDialog, setShowInvestDialog] = useState(false);
  
  // Fetch data using React Query hooks
  const { useInvestmentPlans, useUserInvestments, useInvestmentStats, useCreateInvestment } = useInvestments();
  
  const { 
    data: plans, 
    isLoading: isPlansLoading, 
    refetch: refetchPlans,
    isRefetching: isPlansRefetching 
  } = useInvestmentPlans();
  
  const { 
    data: userInvestments, 
    isLoading: isInvestmentsLoading,
    refetch: refetchInvestments,
    isRefetching: isInvestmentsRefetching 
  } = useUserInvestments();
  
  const { 
    data: stats, 
    isLoading: isStatsLoading,
    refetch: refetchStats,
    isRefetching: isStatsRefetching 
  } = useInvestmentStats();

  const createInvestment = useCreateInvestment();

  const isLoading = isPlansLoading || isInvestmentsLoading || isStatsLoading;
  const isRefetching = isPlansRefetching || isInvestmentsRefetching || isStatsRefetching;

  const onRefresh = () => {
    refetchPlans();
    refetchInvestments();
    refetchStats();
  };

  const handleInvestmentCreate = async () => {
    if (!selectedPlan || !investmentAmount) return;
    
    try {
      await createInvestment.mutateAsync({
        planId: selectedPlan.id,
        amount: parseFloat(investmentAmount)
      });
      
      setShowInvestDialog(false);
      setSelectedPlan(null);
      setInvestmentAmount('');
      onRefresh();
    } catch (error) {
      console.error('Failed to create investment:', error);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowInvestDialog(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Investments</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'plans' && styles.activeTabButton]}
          onPress={() => setActiveTab('plans')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'plans' && styles.activeTabButtonText]}>Investment Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'my' && styles.activeTabButton]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'my' && styles.activeTabButtonText]}>My Investments</Text>
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
            <ActivityIndicator size="large" color="#2e86de" />
            <Text style={styles.loadingText}>Loading investments...</Text>
          </View>
        ) : activeTab === 'plans' ? (
          <View>
            <View style={styles.statsContainer}>
              <Card style={styles.statsCard}>
                <Text style={styles.statsTitle}>Investment Statistics</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Active Investments</Text>
                    <Text style={styles.statValue}>{stats?.activeCount || 0}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Invested</Text>
                    <Text style={styles.statValue}>{formatCurrency(stats?.totalInvested || 0)}</Text>
                  </View>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Returns</Text>
                    <Text style={styles.statValue}>{formatCurrency(stats?.totalReturns || 0)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Average ROI</Text>
                    <Text style={[styles.statValue, { color: '#2ecc71' }]}>
                      {stats?.averageROI ? `+${stats.averageROI}%` : '0%'}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
            
            <Text style={styles.sectionTitle}>Available Plans</Text>
            {plans?.map((plan) => (
              <InvestmentPlanCard 
                key={plan.id} 
                plan={plan} 
                onPress={() => handlePlanSelect(plan)} 
              />
            ))}
          </View>
        ) : (
          <View>
            {userInvestments?.length > 0 ? (
              userInvestments.map((investment) => (
                <InvestmentCard 
                  key={investment.id} 
                  investment={investment} 
                  onPress={() => router.push(`/investments/${investment.id}`)} 
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="wallet-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>You don't have any investments yet</Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => setActiveTab('plans')}
                >
                  <Text style={styles.emptyButtonText}>Explore Investment Plans</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      
      <Dialog 
        visible={showInvestDialog}
        title="Create Investment"
        onClose={() => setShowInvestDialog(false)}
        actions={[
          { 
            label: 'Cancel', 
            onPress: () => setShowInvestDialog(false) 
          },
          { 
            label: 'Invest', 
            onPress: handleInvestmentCreate,
            primary: true,
            disabled: createInvestment.isPending
          }
        ]}
      >
        {selectedPlan && (
          <View style={styles.dialogContent}>
            <Text style={styles.dialogLabel}>Investment Plan</Text>
            <Text style={styles.dialogPlanName}>{selectedPlan.name}</Text>
            <Text style={styles.dialogPlanDetails}>
              {selectedPlan.duration} days • {selectedPlan.roi}% ROI
            </Text>
            
            <Text style={[styles.dialogLabel, { marginTop: 16 }]}>Investment Amount</Text>
            <View style={styles.dialogInputContainer}>
              <Text style={styles.dialogInputPrefix}>$</Text>
              <TextInput
                style={styles.dialogInput}
                value={investmentAmount}
                onChangeText={setInvestmentAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
              />
            </View>
            
            {selectedPlan.minAmount && (
              <Text style={styles.dialogMinAmount}>
                Minimum investment: {formatCurrency(selectedPlan.minAmount)}
              </Text>
            )}
            
            {investmentAmount && (
              <View style={styles.dialogSummary}>
                <Text style={styles.dialogSummaryLabel}>Expected Return</Text>
                <Text style={styles.dialogSummaryValue}>
                  {formatCurrency(parseFloat(investmentAmount) * (1 + selectedPlan.roi / 100))}
                </Text>
                <Text style={styles.dialogSummaryProfit}>
                  Profit: {formatCurrency(parseFloat(investmentAmount) * (selectedPlan.roi / 100))}
                </Text>
              </View>
            )}
          </View>
        )}
      </Dialog>
    </SafeAreaView>
  );
}

function InvestmentPlanCard({ plan, onPress }) {
  return (
    <Card style={styles.planCard}>
      <View style={styles.planHeader}>
        <View>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planDescription}>{plan.description}</Text>
        </View>
        <View style={styles.roiBadge}>
          <Text style={styles.roiText}>{plan.roi}% ROI</Text>
        </View>
      </View>
      
      <View style={styles.planDetails}>
        <View style={styles.planDetailItem}>
          <Text style={styles.planDetailLabel}>Duration</Text>
          <Text style={styles.planDetailValue}>{plan.duration} days</Text>
        </View>
        <View style={styles.planDetailItem}>
          <Text style={styles.planDetailLabel}>Min. Investment</Text>
          <Text style={styles.planDetailValue}>{formatCurrency(plan.minAmount)}</Text>
        </View>
        <View style={styles.planDetailItem}>
          <Text style={styles.planDetailLabel}>Risk Level</Text>
          <Text style={styles.planDetailValue}>{plan.riskLevel}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.investButton} onPress={onPress}>
        <Text style={styles.investButtonText}>Invest Now</Text>
      </TouchableOpacity>
    </Card>
  );
}

function InvestmentCard({ investment, onPress }) {
  const progress = investment.currentDay / investment.duration;
  
  return (
    <Card style={styles.investmentCard} onPress={onPress}>
      <View style={styles.investmentHeader}>
        <View>
          <Text style={styles.investmentPlanName}>{investment.planName}</Text>
          <Text style={styles.investmentAmount}>{formatCurrency(investment.amount)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(investment.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(investment.status) }]}>
            {investment.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.investmentProgress}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>
            {investment.currentDay} / {investment.duration} days
          </Text>
        </View>
        <ProgressBar progress={progress} color="#2e86de" />
      </View>
      
      <View style={styles.investmentDetails}>
        <View style={styles.investmentDetailItem}>
          <Text style={styles.investmentDetailLabel}>Start Date</Text>
          <Text style={styles.investmentDetailValue}>{formatDate(investment.startDate)}</Text>
        </View>
        <View style={styles.investmentDetailItem}>
          <Text style={styles.investmentDetailLabel}>End Date</Text>
          <Text style={styles.investmentDetailValue}>{formatDate(investment.endDate)}</Text>
        </View>
        <View style={styles.investmentDetailItem}>
          <Text style={styles.investmentDetailLabel}>Expected Return</Text>
          <Text style={styles.investmentDetailValue}>{formatCurrency(investment.expectedReturn)}</Text>
        </View>
      </View>
    </Card>
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
    backgroundColor: '#2e86de',
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
  statsContainer: {
    marginBottom: 20,
  },
  statsCard: {
    padding: 15,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  planCard: {
    padding: 15,
    marginBottom: 15,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  planDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  roiBadge: {
    backgroundColor: '#2e86de20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  roiText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e86de',
  },
  planDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  planDetailItem: {
    flex: 1,
  },
  planDetailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  planDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  investButton: {
    backgroundColor: '#2e86de',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  investButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  investmentCard: {
    padding: 15,
    marginBottom: 15,
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  investmentPlanName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  investmentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  investmentProgress: {
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  progressValue: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  investmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  investmentDetailItem: {
    flex: 1,
  },
  investmentDetailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  investmentDetailValue: {
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
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#2e86de',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dialogContent: {
    padding: 15,
  },
  dialogLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  dialogPlanName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  dialogPlanDetails: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  dialogInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    marginTop: 5,
  },
  dialogInputPrefix: {
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  dialogInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
    fontSize: 16,
  },
  dialogMinAmount: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
  },
  dialogSummary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f6fa',
    borderRadius: 8,
  },
  dialogSummaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  dialogSummaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  dialogSummaryProfit: {
    fontSize: 14,
    color: '#2ecc71',
    marginTop: 5,
  },
});
