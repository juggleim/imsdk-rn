import React, { useState, useLayoutEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator,
    Dimensions,
    Platform,
} from 'react-native';
import JuggleIM from 'juggleim-rnsdk';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { addMoment, MomentMedia } from '../api/moment';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 60) / 3; // 3 columns with padding

type RootStackParamList = {
    PublishMoment: { mode: 'text' | 'media' };
    Moment: undefined;
};

type PublishMomentScreenRouteProp = RouteProp<RootStackParamList, 'PublishMoment'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SelectedImage {
    uri: string;
    width: number;
    height: number;
    type?: string;
    uploadedUrl?: string; // Add uploadedUrl
    loading?: boolean;    // Add loading state
    error?: boolean;      // Add error state
}

const PublishMomentScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<PublishMomentScreenRouteProp>();
    const mode = route.params?.mode || 'media';

    const [text, setText] = useState('');
    const [images, setImages] = useState<SelectedImage[]>([]);
    const [publishing, setPublishing] = useState(false);

    useLayoutEffect(() => {
        const isUploading = images.some(img => img.loading);
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={handlePublish}
                    disabled={publishing || (!text.trim() && images.length === 0) || isUploading}
                    style={styles.publishButton}>
                    {publishing || isUploading ? (
                        <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                        <Text
                            style={[
                                styles.publishButtonText,
                                (publishing || (!text.trim() && images.length === 0) || isUploading) && styles.publishButtonTextDisabled,
                            ]}>
                            发表
                        </Text>
                    )}
                </TouchableOpacity>
            ),
        });
    }, [navigation, text, images, publishing]);

    const uploadImage = async (image: SelectedImage, index: number) => {
        try {
            // Initial state is already 'loading: true' from handleSelectImages
            const url = await JuggleIM.uploadImage(image.uri);
            console.log('Uploaded image URL:', url);
            setImages(prev => {
                const newImages = [...prev];
                // Ensure index is valid and refers to specific image just in case
                if (newImages[index]) {
                    newImages[index] = { ...newImages[index], uploadedUrl: url, loading: false };
                }
                return newImages;
            });
        } catch (error) {
            console.error('Failed to upload image:', image.uri, error);
            setImages(prev => {
                const newImages = [...prev];
                if (newImages[index]) {
                    newImages[index] = { ...newImages[index], loading: false, error: true };
                }
                return newImages;
            });
        }
    };

    const handleSelectImages = async () => {
        if (images.length >= 9) {
            Alert.alert('提示', '最多只能选择9张图片');
            return;
        }

        try {
            const result: ImagePickerResponse = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 9 - images.length,
                quality: 0.8,
            });

            if (result.didCancel) {
                return;
            }

            if (result.errorCode) {
                Alert.alert('错误', result.errorMessage || '选择图片失败');
                return;
            }

            if (result.assets) {
                const currentImagesCount = images.length;
                const newImages: SelectedImage[] = result.assets.map((asset: Asset) => ({
                    uri: asset.uri?.replace('file://', '') || '',
                    width: asset.width || 0,
                    height: asset.height || 0,
                    type: asset.type,
                    loading: true, // Start loading immediately
                }));

                // Add new images to state
                setImages(prev => [...prev, ...newImages]);

                // Trigger uploads for new images
                newImages.forEach((img, i) => {
                    // unexpected side-effect: index in state will be currentImagesCount + i
                    uploadImage(img, currentImagesCount + i);
                });
            }
        } catch (error) {
            console.error('Error selecting images:', error);
            Alert.alert('错误', '选择图片失败');
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handlePublish = async () => {
        if (!text.trim() && images.length === 0) {
            return;
        }

        const isUploading = images.some(img => img.loading);
        if (isUploading) {
            Alert.alert('提示', '图片正在上传中，请稍候');
            return;
        }

        const failedImages = images.filter(img => img.error);
        if (failedImages.length > 0) {
            Alert.alert('提示', '部分图片上传失败，请移除或重试');
            return;
        }

        try {
            setPublishing(true);

            // Convert images to MomentMedia format
            const medias: MomentMedia[] = images.map((img) => ({
                type: 'image' as const,
                url: img.uploadedUrl || img.uri, // Use uploadedUrl if available
                snapshot_url: img.uploadedUrl || img.uri,
                width: img.width,
                height: img.height,
            }));

            await addMoment({
                text: text.trim(),
                medias,
            });

            // Navigate back immediately after success
            navigation.goBack();
        } catch (error) {
            console.error('Failed to publish moment:', error);
            Alert.alert('错误', '发布失败，请重试');
        } finally {
            setPublishing(false);
        }
    };

    const renderImageGrid = () => {
        const canAddMore = images.length < 9;

        return (
            <View style={styles.imageGrid}>
                {images.map((image, index) => (
                    <View key={index} style={styles.imageContainer}>
                        <Image source={{ uri: (Platform.OS === 'android' ? 'file://' + image.uri : image.uri) }} style={styles.imageItem} />
                        {image.loading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            </View>
                        )}
                        {image.error && (
                            <View style={styles.errorOverlay}>
                                <Image
                                    source={require('../assets/icons/error.png')}
                                    style={styles.errorIcon}
                                />
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => handleRemoveImage(index)}>
                            <Image
                                source={require('../assets/icons/close.png')}
                                style={styles.removeIcon}
                            />
                        </TouchableOpacity>
                    </View>
                ))}
                {canAddMore && (
                    <TouchableOpacity
                        style={styles.addImageButton}
                        onPress={handleSelectImages}>
                        <Image
                            source={require('../assets/icons/camera.png')}
                            style={styles.addImageIcon}
                        />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <TextInput
                style={styles.textInput}
                placeholder="这一刻的想法..."
                placeholderTextColor="#999999"
                multiline
                value={text}
                onChangeText={setText}
                autoFocus={mode === 'text'}
            />

            {mode === 'media' && renderImageGrid()}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    textInput: {
        fontSize: 16,
        color: '#000000',
        padding: 16,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        paddingTop: 0,
        gap: 8,
    },
    imageContainer: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        position: 'relative',
    },
    imageItem: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
        backgroundColor: '#F0F0F0',
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    removeIcon: {
        width: 12,
        height: 12,
        tintColor: '#FFFFFF',
    },
    addImageButton: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
    },
    addImageIcon: {
        width: 40,
        height: 40,
        tintColor: '#999999',
    },
    publishButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    publishButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    publishButtonTextDisabled: {
        color: '#CCCCCC',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    errorOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    errorIcon: {
        width: 24,
        height: 24,
        tintColor: '#FF3B30',
    },
});

export default PublishMomentScreen;
