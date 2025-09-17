import React, { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  Keyboard,
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

type SavedLocation = {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  pinColor?: string;
};

export default function App() {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [locationName, setLocationName] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [isViewVisible, setIsViewVisible] = useState(true);
  const [isListVisible, setIsListVisible] = useState(false);
  const mapRef = useRef<MapView>(null);

  const initialRegion = {
    latitude: 17.8035236,
    longitude: 102.7478215,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const sampleLocation = {
    id: 0,
    latitude: 17.8035236,
    longitude: 102.7478215,
    title: "Khon Kaen University",
    description: "Nong Khai Campus",
    pinColor: "brown",
  };

  const allLocations = [sampleLocation, ...savedLocations];

  const goToMyLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const userRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      if (mapRef.current) {
        mapRef.current.animateToRegion(userRegion, 1000);
      }
    } catch (error) {
      console.error("Failed to get current location:", error);
      Alert.alert("Error", "Could not fetch your location.");
    }
  };

  const saveCurrentLocation = async () => {
    if (!locationName.trim()) {
      Alert.alert("Incomplete", "Please enter a location name.");
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const newLocation: SavedLocation = {
        id: Date.now(),
        latitude,
        longitude,
        title: locationName,
        description: locationDescription
          ? locationDescription
          : "No description provided",
      };

      setSavedLocations((prevLocations) => [...prevLocations, newLocation]);

      setLocationName("");
      setLocationDescription("");
      setIsInputVisible(false);
      setIsViewVisible(true);
    } catch (error) {
      console.error("Failed to save location:", error);
      Alert.alert("Error", "Could not save your location.");
    }
    Keyboard.dismiss();
  };

  const panToLocation = (location: SavedLocation) => {
    if (mapRef.current) {
      const region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(region, 1000);
    }
    setIsListVisible(false);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("Permission to access location was denied");
        Alert.alert(
          "Permission Denied",
          "Permission to access location was denied."
        );
        return;
      }
    })();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Modal
        animationType="fade"
        transparent={true}
        visible={isListVisible}
        onRequestClose={() => setIsListVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Saved Locations</Text>
            <FlatList
              data={allLocations}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => panToLocation(item)}
                >
                  <Text style={styles.listItemTitle}>{item.title}</Text>
                  <Text style={styles.listItemDescription}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setIsListVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={true}
        style={styles.map}
      >
        {allLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.title}
            description={location.description}
            pinColor={location.pinColor || "green"}
          />
        ))}
      </MapView>

      <View style={styles.uiContainer}>
        <TouchableOpacity
          onPress={goToMyLocation}
          style={styles.goToMyLocationButton}
        >
          <Text style={styles.locationButtonText}>📍</Text>
        </TouchableOpacity>
        
        <View style={styles.inputContainer}>
          {isInputVisible ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Location Name"
                value={locationName}
                onChangeText={setLocationName}
              />
              <TextInput
                style={styles.input}
                placeholder="Location Description"
                value={locationDescription}
                onChangeText={setLocationDescription}
              />
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={saveCurrentLocation}
              >
                <Text style={[styles.buttonText, { color: "white" }]}>
                  Save Location
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setIsInputVisible(false);
                  setIsViewVisible(true);
                  setLocationName("");
                  setLocationDescription("");
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setIsInputVisible(true);
                setIsViewVisible(false);
              }}
            >
              <Text style={[styles.buttonText, { color: "white" }]}>
                Add Current Location
              </Text>
            </TouchableOpacity>
          )}

          {isViewVisible ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setIsListVisible(true)}
            >
              <Text style={styles.buttonText}>View Locations</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  uiContainer: {
    position: "absolute",
    alignItems: "flex-end",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    pointerEvents: "box-none",
  },
  goToMyLocationButton: {
    backgroundColor: "white",
    alignSelf: "flex-start",
    top: 40,
    padding: 6,
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  locationButtonText: {
    fontSize: 24,
  },
  inputContainer: {
    backgroundColor: "white",
    alignSelf: "flex-end",
    width: "75%",
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    pointerEvents: "auto",
  },
  input: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  primaryButton: {
    backgroundColor: "#007BFF",
    alignItems: "center",
    padding: 12,
    borderRadius: 5,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    marginTop: 10,
    padding: 12,
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 15,
    fontSize: 22,
    fontWeight: "bold",
  },
  listItem: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  listItemDescription: {
    fontSize: 14,
    color: "#666",
  },
});
