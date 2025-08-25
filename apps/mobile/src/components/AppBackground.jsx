import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function AppBackground({ children, variant = "default" }) {
  const renderBackground = () => {
    switch (variant) {
      case "dashboard":
        return (
          <>
            {/* Corner vignettes */}
            <LinearGradient
              colors={["rgba(255, 123, 0, 0.3)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "50%",
                height: "50%",
              }}
            />
            <LinearGradient
              colors={["rgba(255, 123, 0, 0.2)", "transparent"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "50%",
                height: "50%",
              }}
            />
          </>
        );
      case "wallet":
        return (
          <>
            {/* Main gradient */}
            <LinearGradient
              colors={["rgba(255, 123, 0, 0.4)", "transparent"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "80%",
                height: "60%",
              }}
            />
            {/* Corner Clips */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 60,
                height: 60,
                backgroundColor: "#000",
                borderBottomRightRadius: 60,
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 60,
                height: 60,
                backgroundColor: "#000",
                borderTopLeftRadius: 60,
              }}
            />
          </>
        );
      case "investments":
        return (
          <>
            {/* Investment gradient */}
            <LinearGradient
              colors={["rgba(76, 175, 80, 0.2)", "transparent"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "70%",
                height: "40%",
              }}
            />
            <LinearGradient
              colors={["rgba(255, 123, 0, 0.15)", "transparent"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "60%",
                height: "50%",
              }}
            />
          </>
        );
      case "loans":
        return (
          <>
            {/* Loan gradient */}
            <LinearGradient
              colors={["rgba(156, 39, 176, 0.2)", "transparent"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "70%",
                height: "40%",
              }}
            />
            <LinearGradient
              colors={["rgba(63, 81, 181, 0.15)", "transparent"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "60%",
                height: "50%",
              }}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {renderBackground()}
      {children}
    </View>
  );
}