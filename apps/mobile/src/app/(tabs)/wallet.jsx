import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppScreen from "../../components/AppScreen";
import { LinearGradient } from "expo-linear-gradient";

// Mock data for wallet transactions
const MOCK_TRANSACTIONS = [
  {
    id: "1",
    type: "deposit",
    amount: 500.00,
    date: "2023-10-15T10:30:00Z",
    status: "completed",
    description: "Deposit from Bank Account",
  },
  {
    id: "2",
    type: "withdrawal",
    amount: 150.00,
    date: "2023-10-12T14:45:00Z",
    status: "completed",
    description: "ATM Withdrawal",
  },
  {
    id: "3",
    type: "transfer",
    amount: 200.00,
    date: "2023-10-10T09:15:00Z",
    status: "completed",
    description: "Transfer to John Doe",
  },
  {
    id: "4",
    type: "deposit",
    amount: 1000.00,
    date: "2023-10-05T16:20:00Z",
    status: "completed",
    description: "Salary Deposit",
  },
  {
    id: "5",
    type: "withdrawal",
    amount: 75.50,
    date: "2023-10-03T11:10:00Z",
    status: "completed",
    description: "Online Purchase",
  },
];

export default function Wallet() {
  const [balance, setBalance] = useState(1750.50);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setTransactions(MOCK_TRANSACTIONS);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === "all") return true;
    return transaction.type === activeTab;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const renderTransactionItem = ({ item }) => {
    const isDeposit = item.type === "deposit";
    const isWithdrawal = item.type === "withdrawal";
    const isTransfer = item.type === "transfer";
    
    let iconName = "swap-horizontal";
    if (isDeposit) iconName = "arrow-down";
    if (isWithdrawal) iconName = "arrow-up";
    
    let iconColor = "#4CAF50";
    if (isWithdrawal) iconColor = "#F44336";
    if (isTransfer) iconColor = "#2196F3";

    return (
      <TouchableOpacity style={styles.transactionItem}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>{item.description}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={[styles.transactionAmount, { color: isDeposit ? "#4CAF50" : isWithdrawal ? "#F44336" : "#2196F3" }]}>
            {isDeposit ? "+" : isWithdrawal ? "-" : ""} ${item.amount.toFixed(2)}
          </Text>
          <Text style={[styles.transactionStatus, { color: item.status === "completed" ? "#4CAF50" : "#FFC107" }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AppScreen
      backgroundVariant="wallet"
      headerProps={{
        title: "Wallet",
        rightComponents: [
          <TouchableOpacity key="refresh" style={styles.headerButton}>
            <Ionicons name="refresh" size={22} color="#FFF" />
          </TouchableOpacity>,
        ],
      }}
    >
      <View style={styles.container}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={["#FF7B00", "#FF5722"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Ionicons name="eye-outline" size={24} color="#FFF" />
            </View>
            
            <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
            
            <View style={styles.balanceActions}>
              <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionIcon}>
                  <Ionicons name="add" size={24} color="#FF7B00" />
                </View>
                <Text style={styles.actionText}>Add</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionIcon}>
                  <Ionicons name="arrow-up" size={24} color="#FF7B00" />
                </View>
                <Text style={styles.actionText}>Send</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionIcon}>
                  <Ionicons name="swap-horizontal" size={24} color="#FF7B00" />
                </View>
                <Text style={styles.actionText}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Transaction Filters */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterTab, activeTab === "all" && styles.activeFilterTab]}
            onPress={() => setActiveTab("all")}
          >
            <Text style={[styles.filterText, activeTab === "all" && styles.activeFilterText]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeTab === "deposit" && styles.activeFilterTab]}
            onPress={() => setActiveTab("deposit")}
          >
            <Text style={[styles.filterText, activeTab === "deposit" && styles.activeFilterText]}>Deposits</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeTab === "withdrawal" && styles.activeFilterTab]}
            onPress={() => setActiveTab("withdrawal")}
          >
            <Text style={[styles.filterText, activeTab === "withdrawal" && styles.activeFilterText]}>Withdrawals</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeTab === "transfer" && styles.activeFilterTab]}
            onPress={() => setActiveTab("transfer")}
          >
            <Text style={[styles.filterText, activeTab === "transfer" && styles.activeFilterText]}>Transfers</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsContainer}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF7B00" />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : filteredTransactions.length > 0 ? (
            <FlatList
              data={filteredTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.transactionsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={60} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          )}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  balanceCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  balanceGradient: {
    padding: 24,
    borderRadius: 16,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 24,
  },
  balanceActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    alignItems: "center",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: "#FF7B00",
  },
  filterText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#FFF",
  },
  transactionsContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  viewAllText: {
    color: "#FF7B00",
    fontSize: 14,
    fontWeight: "500",
  },
  transactionsList: {
    paddingBottom: 16,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFF",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
  },
});