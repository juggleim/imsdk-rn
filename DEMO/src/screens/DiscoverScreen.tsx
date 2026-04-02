import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const DiscoverScreen = () => {
    const navigation = useNavigation();

    const handleMomentPress = () => {
        navigation.navigate('Moment' as never);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <TouchableOpacity style={styles.item} onPress={handleMomentPress}>
                    <View style={styles.itemLeft}>
                        <Image
                            source={require('../assets/icons/discover.png')}
                            style={styles.itemIcon}
                        />
                        <Text style={styles.itemText}>Moments</Text>
                    </View>
                    <Image
                        source={require('../assets/icons/rightArrowIcon.png')}
                        style={styles.arrowIcon}
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 15,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
    },
    content: {
        marginTop: 10,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingVertical: 15,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemIcon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    itemText: {
        fontSize: 16,
        color: '#000000',
    },
    arrowIcon: {
        width: 16,
        height: 16,
        tintColor: '#999999',
    },
});

export default DiscoverScreen;
