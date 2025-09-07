import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>9:41</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Pending Jobs</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>R250.00</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
        </View>
        
        {/* Go Online Button */}
        <TouchableOpacity style={styles.onlineButton}>
          <Text style={styles.onlineButtonText}>Go Online</Text>
        </TouchableOpacity>
        
        {/* Today's Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.todaySummary}>
            <View style={styles.todayItem}>
              <Text style={styles.todayNumber}>0</Text>
              <Text style={styles.todayLabel}>Pending jobs</Text>
            </View>
            <View style={styles.todayItem}>
              <Text style={styles.todayNumber}>R0.00</Text>
            </View>
          </View>
        </View>
        
        {/* Upcoming Jobs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          
          <View style={styles.jobCard}>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.addressText}>123 Main St</Text>
            </View>
            
            <View style={styles.addressRow}>
              <Ionicons name="navigate-outline" size={16} color="#666" />
              <Text style={styles.addressText}>456 Elm St</Text>
            </View>
            
            <View style={styles.jobDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={styles.detailValue}>10 km</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>ETA</Text>
                <Text style={styles.detailValue}>15 MIN</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.viewMapButton}>
              <Text style={styles.viewMapText}>VIEW MAP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  timeContainer: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  timeText: {
    fontSize: 14,
    color: '#333',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  onlineButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  onlineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  todaySummary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayItem: {
    flex: 1,
    alignItems: 'center',
  },
  todayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  todayLabel: {
    fontSize: 14,
    color: '#666',
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  viewMapButton: {
    marginTop: 15,
    paddingVertical: 12,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewMapText: {
    color: '#333',
    fontWeight: 'bold',
  },
});