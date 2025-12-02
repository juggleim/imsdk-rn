import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ContactsScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Contacts</Text>
            <Text style={styles.subtext}>Coming Soon</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subtext: {
        fontSize: 16,
        color: '#999',
        marginTop: 8,
    },
});

export default ContactsScreen;
