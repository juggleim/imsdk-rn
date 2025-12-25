
import React, { useState, useEffect, useRef, Component } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Dimensions,
    FlatList,
    findNodeHandle,
    NodeHandle
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    JuggleIMCall,
    CallSession,
    CallMember,
    CallStatus,
    CallFinishReason,
    ZegoSurfaceView,
    CallMediaType
} from 'juggleim-rnsdk';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const VideoCallScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { callId, isIncoming } = route.params;

    const [session, setSession] = useState<CallSession | null>(null);
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.IDLE);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [remoteMembers, setRemoteMembers] = useState<CallMember[]>([]);
    const [isViewReady, setIsViewReady] = useState(false);

    // Refs for views to pass to native
    const localViewRef = useRef<View>(null);
    const remoteViewRefs = useRef<Map<string, any>>(new Map());

    useEffect(() => {
        let timer: any;
        if (callStatus === CallStatus.CONNECTED) {
            timer = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [callStatus]);

    useEffect(() => {
        const initCall = async () => {
            console.log('initCall', callId);
            let currentSession = await JuggleIMCall.getCallSession(callId);
            if (!currentSession) {
                Alert.alert('Error', 'Call session not found', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
                return;
            }
            setSession(currentSession);
            setCallStatus(currentSession.callStatus);
            console.log('currentSession', currentSession.currentMember);
            const cleanup = currentSession.addListener({
                onCallConnect: () => {
                    console.log('onCallConnect');
                    setCallStatus(CallStatus.CONNECTED);
                    if (localViewRef.current) {
                        const viewTag = findNodeHandle(localViewRef.current);
                        console.log('viewTag', viewTag);
                        currentSession.startPreview(viewTag);
                    }
                },
                onCallFinish: (reason) => {
                    console.log('onCallFinish', reason);
                    navigation.goBack();
                },
                onErrorOccur: (error) => {
                    console.error('onErrorOccur', error);
                    Alert.alert('Error', `Call Error: ${error}`);
                    navigation.goBack();
                },
                onUsersConnect: (userIdList) => {
                    console.log('onUsersConnect', userIdList);
                    refreshMembers(currentSession!);
                },
                onUsersLeave: (userIdList) => {
                    console.log('onUsersLeave', userIdList);
                    refreshMembers(currentSession!);
                },
                onUserCameraEnable: (userId, enable) => {
                    console.log('onUserCameraEnable', userId, enable);
                }
            });

            console.log('isIncoming', isIncoming, 'mediaType', currentSession.mediaType, 'isViewReady', isViewReady);
            const viewTag = findNodeHandle(localViewRef.current);
            console.log('viewTag', viewTag);
            currentSession.startPreview(viewTag);
            return () => {
                cleanup();
            };
        };

        initCall();
    }, [callId]);

    const refreshMembers = (currentSession: CallSession) => {
        setRemoteMembers(currentSession.members.filter(m => m.userInfo.userId !== currentSession.currentMember.userInfo.userId));
    };

    const handleAccept = () => {
        session?.accept();
    };

    const handleHangup = () => {
        session?.hangup();
        navigation.goBack();
    };

    const toggleMute = () => {
        if (session) {
            const newMute = !isMuted;
            session.muteMicrophone(newMute);
            setIsMuted(newMute);
        }
    };

    const toggleSpeaker = () => {
        if (session) {
            const newSpeaker = !isSpeakerOn;
            session.setSpeakerEnable(newSpeaker);
            setIsSpeakerOn(newSpeaker);
        }
    };

    const toggleCamera = () => {
        if (session) {
            const newCamera = !isCameraOn;
            session.enableCamera(newCamera);
            setIsCameraOn(newCamera);
        }
    };

    const switchCamera = () => {
        session?.useFrontCamera(true); // TODO: Toggle front/back state logic if API supports checking current. 
        // SDK `useFrontCamera(boolean)` sets it.
        // We might need a state `isFrontCamera`
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const renderRemoteVideo = ({ item }: { item: CallMember }) => {
        console.log('renderRemoteVideo', item);
        return (
            <View style={styles.remoteViewContainer}>
                <ZegoSurfaceView
                    style={styles.remoteVideo}
                    ref={(ref: any) => {
                        if (ref && session) {
                            const viewTag = findNodeHandle(ref);
                            session.setVideoView(item.userInfo.userId, viewTag);
                        }
                    }}
                />
                <Text style={styles.remoteName}>{item.userInfo.nickname || item.userInfo.userId}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Background / Main Video Area */}
            {remoteMembers.length > 0 ? (
                remoteMembers.length === 1 ? (
                    // Single Remote View (Full Screen)
                    <View style={styles.fullScreenVideo}>
                        <ZegoSurfaceView
                            style={styles.fullScreenVideo}
                            ref={(ref: number | React.ComponentClass<any, any> | React.Component<any, any, any> | null) => {
                                if (ref && session) {
                                    const viewTag = findNodeHandle(ref);
                                    remoteViewRefs.current.set(remoteMembers[0].userInfo.userId, viewTag);
                                }
                            }}
                            onLayout={() => {
                                const viewTag = remoteViewRefs.current.get(remoteMembers[0].userInfo.userId);
                                console.log('onLayout', session, viewTag);
                                session?.setVideoView(remoteMembers[0].userInfo.userId, viewTag);
                            }}
                        />
                    </View>
                ) : (
                    // Multi Remote View (Grid)
                    <View style={styles.gridContainer}>
                        <FlatList
                            data={remoteMembers}
                            renderItem={renderRemoteVideo}
                            keyExtractor={item => item.userInfo.userId}
                            numColumns={2}
                        />
                    </View>
                )
            ) : (
                <View style={styles.waitingContainer}>
                    <Text style={styles.waitingText}>
                        {isIncoming ? 'Inviting you to a video call...' : 'Waiting for others to join...'}
                    </Text>
                </View>
            )}

            {/* Local Preview (PiP) */}
            <View style={styles.localViewContainer}>
                <ZegoSurfaceView
                    style={styles.localVideo}
                    zOrderMediaOverlay={true}
                    zOrderOnTop={true}
                    onLayout={() => setIsViewReady(true)}
                    ref={localViewRef}
                />
            </View>

            {/* Controls Overlay */}
            <SafeAreaView style={styles.controlsContainer}>
                {isIncoming && callStatus === CallStatus.INCOMING ? (
                    <View style={styles.incomingControls}>
                        <TouchableOpacity style={[styles.controlButton, styles.hangupButton]} onPress={handleHangup}>
                            <Text style={styles.controlText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.controlButton, styles.acceptButton]} onPress={handleAccept}>
                            <Text style={styles.controlText}>Accept</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.activeControls}>
                        <Text style={styles.durationText}>{formatTime(duration)}</Text>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.iconButton} onPress={toggleMute}>
                                <Text style={styles.iconText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={toggleCamera}>
                                <Text style={styles.iconText}>{isCameraOn ? 'Cam Off' : 'Cam On'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={toggleSpeaker}>
                                <Text style={styles.iconText}>{isSpeakerOn ? 'Spk Off' : 'Spk On'}</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={[styles.controlButton, styles.hangupButtonLarge]} onPress={handleHangup}>
                            <Text style={styles.controlText}>Hangup</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2b2b2b',
    },
    fullScreenVideo: {
        width: width,
        height: height,
        position: 'absolute',
    },
    gridContainer: {
        flex: 1,
        marginTop: 100, // Leave space for something?
    },
    remoteViewContainer: {
        width: width / 2,
        height: width / 2 * 1.3,
        borderColor: 'black',
        borderWidth: 1,
    },
    remoteVideo: {
        flex: 1,
    },
    remoteName: {
        position: 'absolute',
        bottom: 5,
        left: 5,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 2,
    },
    waitingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    waitingText: {
        color: 'white',
        fontSize: 18,
    },
    localViewContainer: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 100,
        height: 150,
        backgroundColor: 'black',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'white',
    },
    localVideo: {
        flex: 1,
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 20,
    },
    incomingControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    activeControls: {
        alignItems: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    controlButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hangupButton: {
        backgroundColor: '#ff3b30',
    },
    acceptButton: {
        backgroundColor: '#30b959',
    },
    hangupButtonLarge: {
        backgroundColor: '#ff3b30',
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    controlText: {
        color: 'white',
        fontWeight: '600',
    },
    iconButton: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
    },
    iconText: {
        color: 'white',
    },
    durationText: {
        color: 'white',
        fontSize: 18,
        marginBottom: 20,
    }
});

export default VideoCallScreen;
