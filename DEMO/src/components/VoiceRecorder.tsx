import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Platform,
    Modal,
    TouchableWithoutFeedback
} from 'react-native';
import { useSoundRecorder } from 'react-native-nitro-sound';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface VoiceRecorderProps {
    visible: boolean;
    onClose: () => void;
    onSend: (file: { uri: string; duration: number }) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ visible, onClose, onSend }) => {
    const [recordTime, setRecordTime] = useState('00:00');
    const [recordSecs, setRecordSecs] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [recordUri, setRecordUri] = useState('');
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const { startRecorder, stopRecorder, mmssss } = useSoundRecorder({
        onRecord: (e) => {
            if (e.currentPosition !== undefined) {
                setRecordSecs(Math.floor(e.currentPosition / 1000));
                setRecordTime(mmssss(Math.floor(e.currentPosition)));
            }
        },
    });

    useEffect(() => {
        if (visible) {
            startRecordingWithPermission();
        } else {
            handleStopRecording(false);
        }
    }, [visible]);

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            scaleAnim.setValue(1);
        }
    }, [isRecording]);

    const checkPermission = async () => {
        const permission = Platform.OS === 'ios'
            ? PERMISSIONS.IOS.MICROPHONE
            : PERMISSIONS.ANDROID.RECORD_AUDIO;

        const result = await check(permission);
        if (result === RESULTS.GRANTED) {
            return true;
        }

        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
    };

    const startRecordingWithPermission = async () => {
        const hasPermission = await checkPermission();
        if (!hasPermission) {
            console.log('Microphone permission denied');
            onClose();
            return;
        }

        try {
            const result = await startRecorder(undefined, {
                AudioEncoderAndroid: 3, // AAC
                AudioSourceAndroid: 1, // MIC
                AVEncoderAudioQualityKeyIOS: 64, // Medium quality
                AVNumberOfChannelsKeyIOS: 1, // Mono to reduce file size
                AVFormatIDKeyIOS: 'aac',
            });

            setRecordUri(result);
            setIsRecording(true);
            console.log('Recording started at:', result);
        } catch (error) {
            console.error('Failed to start recording:', error);
            onClose();
        }
    };

    const handleStopRecording = async (shouldSend: boolean) => {
        if (!isRecording) return;

        try {
            setIsRecording(false);
            const result = await stopRecorder();

            const duration = recordSecs;
            const uri = result;

            if (shouldSend && duration > 0 && uri) {
                onSend({
                    uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                    duration: duration,
                });
            }

            setRecordSecs(0);
            setRecordTime('00:00');
            setRecordUri('');
        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    };

    const handleCancel = () => {
        handleStopRecording(false);
        onClose();
    };

    const handleSend = () => {
        handleStopRecording(true);
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleCancel}
        >
            <TouchableWithoutFeedback onPress={handleCancel}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.container}>
                            <Text style={styles.title}>Recording Voice</Text>

                            <Animated.View style={[styles.recordButton, { transform: [{ scale: scaleAnim }] }]}>
                                <View style={styles.recordButtonInner} />
                            </Animated.View>

                            <Text style={styles.timer}>{recordTime}</Text>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={handleCancel}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, styles.sendButton]}
                                    onPress={handleSend}
                                    disabled={recordSecs === 0}
                                >
                                    <Text style={styles.sendButtonText}>Send</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '80%',
        maxWidth: 300,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 30,
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    recordButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    timer: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
        fontVariant: ['tabular-nums'],
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 15,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 100,
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    sendButton: {
        backgroundColor: '#3399ff',
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default VoiceRecorder;
