import React, { useState, useRef, useEffect } from 'react';
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
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface VoiceRecorderProps {
    visible: boolean;
    onClose: () => void;
    onSend: (file: { uri: string; duration: number }) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ visible, onClose, onSend }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordTime, setRecordTime] = useState('00:00');
    const [recordSecs, setRecordSecs] = useState(0);
    const audioRecorderPlayer = useRef<AudioRecorderPlayer>(new AudioRecorderPlayer()).current;
    const recordPath = useRef('');
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            startRecording();
        } else {
            stopRecording(false);
        }
        return () => {
            audioRecorderPlayer.removeRecordBackListener();
        };
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

    const startRecording = async () => {
        const hasPermission = await checkPermission();
        if (!hasPermission) {
            console.log('Microphone permission denied');
            onClose();
            return;
        }

        try {
            const path = Platform.select({
                ios: 'voice_recording.m4a',
                android: 'sdcard/voice_recording.mp4',
            });

            recordPath.current = path || '';

            await audioRecorderPlayer.startRecorder(path);
            audioRecorderPlayer.addRecordBackListener((e: any) => {
                setRecordSecs(Math.floor(e.currentPosition / 1000));
                setRecordTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)).substring(0, 5));
            });

            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
            onClose();
        }
    };

    const stopRecording = async (shouldSend: boolean) => {
        if (!isRecording) return;

        try {
            const result = await audioRecorderPlayer.stopRecorder();
            audioRecorderPlayer.removeRecordBackListener();
            setIsRecording(false);

            if (shouldSend && recordSecs > 0) {
                onSend({
                    uri: result,
                    duration: recordSecs,
                });
            }
        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    };

    const handleCancel = () => {
        stopRecording(false);
        onClose();
    };

    const handleSend = () => {
        stopRecording(true);
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
