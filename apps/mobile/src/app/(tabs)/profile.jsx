import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppScreen from "../../components/AppScreen";
import { useAuth } from "../../contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

export default function Profile() {
  const { user, signOut, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert("Error", "Name and email are required");
      return;
    }

    setLoading(true);
    try {
      // In a real app, this would call the API
      // await updateProfile(formData);
      
      // Simulate API call
      setTimeout(() => {
        setIsEditing(false);
        setLoading(false);
        Alert.alert("Success", "Profile updated successfully");
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => signOut()
        }
      ]
    );
  };

  return (
    <AppScreen 
      backgroundVariant="profile"
      headerProps={{
        title: "Profile",
        rightComponents: [
          !isEditing ? (
            <TouchableOpacity 
              key="edit" 
              style={styles.headerButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={22} color="#FFF" />
            </TouchableOpacity>
          ) : null,
        ],
      }}
    >
      <View style={styles.container}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: user?.avatar || "https://ui-avatars.com/api/?name=" + (user?.name || "User") + "&background=FF7B00&color=fff" }} 
              style={styles.avatar} 
            />
            {isEditing && (
              <TouchableOpacity style={styles.changeAvatarButton}>
                <Ionicons name="camera" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
          
          {!isEditing ? (
            <Text style={styles.userName}>{user?.name || "User"}</Text>
          ) : null}
        </View>

        {/* Profile Form */}
        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                placeholder="Your name"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            ) : (
              <Text style={styles.value}>{user?.name || "Not set"}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => handleInputChange("email", text)}
                placeholder="Your email"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.value}>{user?.email || "Not set"}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => handleInputChange("phone", text)}
                placeholder="Your phone number"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{user?.phone || "Not set"}</Text>
            )}
          </View>

          {isEditing && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user?.name || "",
                    email: user?.email || "",
                    phone: user?.phone || "",
                  });
                }}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={24} color="#FFF" style={styles.settingIcon} />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#FFF" style={styles.settingIcon} />
            <Text style={styles.settingText}>Security</Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={24} color="#FFF" style={styles.settingIcon} />
            <Text style={styles.settingText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="information-circle-outline" size={24} color="#FFF" style={styles.settingIcon} />
            <Text style={styles.settingText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#F44336" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FF7B00",
  },
  changeAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF7B00",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1A1A2E",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#FFF",
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#FF7B00",
    marginLeft: 10,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  settingsSection: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  settingIcon: {
    marginRight: 16,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#FFF",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderRadius: 8,
    paddingVertical: 14,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: "#F44336",
    fontSize: 16,
    fontWeight: "600",
  },
});