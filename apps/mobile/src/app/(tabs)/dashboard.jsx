import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import useAppFonts from "../../hooks/useAppFonts";
import AppScreen from "../../components/AppScreen";
import { HeaderButton } from "../../components/AppHeader";
import { useAuth } from "@/utils/auth/useAuth";

function WalletCard({ balance = 0, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ marginBottom: 24 }}>
      <LinearGradient
        colors={["#FF7B00", "#FF9500", "#FFB800"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 24,
          marginHorizontal: 20,
        }}
      >
        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.8)",
              fontFamily: "Inter_500Medium",
              fontSize: 14,
            }}
          >
            Wallet Balance
          </Text>
        </View>
        <Text
          style={{
            color: "#FFF",
            fontFamily: "SpaceGrotesk_700Bold",
            fontSize: 32,
            marginBottom: 16,
          }}
        >
          ${balance.toLocaleString()}
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.8)",
              fontFamily: "Inter_400Regular",
              fontSize: 12,
            }}
          >
            Available for investment
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="rgba(255, 255, 255, 0.8)"
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function QuickActionCard({
  title,
  subtitle,
  icon,
  onPress,
  color = "#FF7B00",
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.lightAsync();
        onPress();
      }}
      style={{
        flex: 1,
        backgroundColor: "rgba(17, 17, 17, 0.8)",
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 4,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: `${color}20`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text
        style={{
          color: "#FFF",
          fontFamily: "Inter_600SemiBold",
          fontSize: 16,
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: "#9A9A9A",
          fontFamily: "Inter_400Regular",
          fontSize: 12,
        }}
      >
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

function InvestmentPlanCard({ plan, onPress }) {
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync();
        onPress(plan);
      }}
      style={{
        backgroundColor: "rgba(17, 17, 17, 0.8)",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        marginHorizontal: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
              marginBottom: 4,
            }}
          >
            {plan.name}
          </Text>
          <Text
            style={{
              color: "#9A9A9A",
              fontFamily: "Inter_400Regular",
              fontSize: 14,
            }}
          >
            {plan.description}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "#FF7B0020",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              color: "#FF7B00",
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
            }}
          >
            {plan.roi_percentage}% ROI
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <View>
          <Text
            style={{
              color: "#6E6E6F",
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            Minimum
          </Text>
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
            }}
          >
            ${plan.min_amount}
          </Text>
        </View>
        <View>
          <Text
            style={{
              color: "#6E6E6F",
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            Duration
          </Text>
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
            }}
          >
            {plan.duration_value} {plan.duration_unit}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: "#FF7B00",
            fontFamily: "Inter_500Medium",
            fontSize: 14,
          }}
        >
          Start Investing
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#FF7B00" />
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { isAuthenticated, isReady, signIn, auth } = useAuth();
  const [scrollY] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [investmentPlans, setInvestmentPlans] = useState([]);
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    if (isReady && isAuthenticated) {
      fetchWalletBalance();
      fetchInvestmentPlans();
    }
  }, [isReady, isAuthenticated]);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch("/api/wallets/balance");
      if (response.ok) {
        const data = await response.json();
        if (data.wallets && data.wallets.length > 0) {
          setWalletBalance(parseFloat(data.wallets[0].balance) || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  };

  const fetchInvestmentPlans = async () => {
    try {
      const response = await fetch("/api/investment-plans");
      if (response.ok) {
        const data = await response.json();
        setInvestmentPlans(data.plans || []);
      }
    } catch (error) {
      console.error("Error fetching investment plans:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWalletBalance(), fetchInvestmentPlans()]);
    setRefreshing(false);
  };

  if (!fontsLoaded) {
    return null;
  }

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#FFF", fontFamily: "Inter_400Regular" }}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppScreen
        backgroundVariant="dashboard"
        headerProps={{ show: false }}
        contentContainerStyle={{
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Ionicons
            name="wallet"
            size={80}
            color="#FF7B00"
            style={{ marginBottom: 24 }}
          />
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Inter_700Bold",
              fontSize: 28,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Investment Platform
          </Text>
          <Text
            style={{
              color: "#9A9A9A",
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Your gateway to smart investing and financial growth
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync("medium");
            signIn();
          }}
          style={{
            backgroundColor: "#FF7B00",
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 32,
            width: "100%",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
            }}
          >
            Get Started
          </Text>
        </TouchableOpacity>
      </AppScreen>
    );
  }

  const headerRightComponents = [
    <HeaderButton
      key="notifications"
      iconName="notifications-outline"
      onPress={() => Haptics.lightAsync()}
      backgroundColor="rgba(0, 0, 0, 0.75)"
      borderColor={null}
      iconColor="#FFF"
      showNotificationDot={true}
      notificationColor="#FF7B00"
    />,
  ];

  return (
    <AppScreen
      backgroundVariant="dashboard"
      headerProps={{
        scrollY,
        rightComponents: headerRightComponents,
      }}
      scrollable={true}
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF7B00"
          />
        ),
        onScroll: Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        ),
        scrollEventThrottle: 16,
      }}
    >
      {/* Welcome Message */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text
          style={{
            color: "#9A9A9A",
            fontFamily: "Inter_400Regular",
            fontSize: 16,
            marginBottom: 4,
          }}
        >
          Welcome back
        </Text>
        <Text
          style={{
            color: "#FFF",
            fontFamily: "Inter_700Bold",
            fontSize: 28,
          }}
        >
          {auth?.user?.email?.split("@")[0] || "Investor"}
        </Text>
      </View>

      {/* Wallet Card */}
      <WalletCard balance={walletBalance} onPress={() => {}} />

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
        <Text
          style={{
            color: "#FFF",
            fontFamily: "Inter_600SemiBold",
            fontSize: 18,
            marginBottom: 16,
          }}
        >
          Quick Actions
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <QuickActionCard
            title="Deposit"
            subtitle="Add funds"
            icon="add-circle"
            onPress={() => {}}
            color="#4CAF50"
          />
          <QuickActionCard
            title="Invest"
            subtitle="Start earning"
            icon="trending-up"
            onPress={() => {}}
            color="#FF7B00"
          />
        </View>
      </View>

      {/* Investment Plans */}
      <View style={{ marginBottom: 32 }}>
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
            }}
          >
            Investment Plans
          </Text>
        </View>

        {investmentPlans.length > 0 ? (
          investmentPlans.map((plan) => (
            <InvestmentPlanCard
              key={plan.id}
              plan={plan}
              onPress={(selectedPlan) => {
                // Navigate to investment screen with plan
                console.log("Selected plan:", selectedPlan);
              }}
            />
          ))
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <Text
              style={{
                color: "#6E6E6F",
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                textAlign: "center",
                paddingVertical: 20,
              }}
            >
              No investment plans available
            </Text>
          </View>
        )}
      </View>
    </AppScreen>
  );
}
