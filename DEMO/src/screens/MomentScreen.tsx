import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    JuggleIMMoment,
    Moment,
    MomentComment,
    MomentMedia,
    MomentReaction,
    UserInfo
} from 'juggleim-rnsdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_AVATAR_KEY, USER_ID_KEY, USER_NAME_KEY } from '../utils/auth';

type RootStackParamList = {
    PublishMoment: { mode: 'text' | 'media' };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 250;

// Format relative time
const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
        return `${minutes < 0 ? 0 : minutes}分钟前`;
    } else if (hours < 24) {
        return `${hours}小时前`;
    } else {
        return `${days}天前`;
    }
};

const MomentScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const isFocused = useIsFocused();

    const [moments, setMoments] = useState<Moment[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [currentUserName, setCurrentUserName] = useState<string>('User');
    const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');

    // Bubble menu state
    const [activeBubbleMomentId, setActiveBubbleMomentId] = useState<string | null>(null);

    // Comment modal state
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [selectedMomentId, setSelectedMomentId] = useState<string>('');
    const [replyToComment, setReplyToComment] = useState<MomentComment | null>(null);

    // Image preview state
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);

    useEffect(() => {
        loadCurrentUser();
    }, []);

    useEffect(() => {
        if (isFocused) {
            loadMoments(true);
        }
    }, [isFocused]);

    const loadCurrentUser = async () => {
        try {
            const userId = await AsyncStorage.getItem(USER_ID_KEY);
            const userName = await AsyncStorage.getItem(USER_NAME_KEY);
            const userAvatar = await AsyncStorage.getItem(USER_AVATAR_KEY);
            console.log('User info:', userId, userName, userAvatar);
            if (userId) setCurrentUserId(userId);
            if (userName) setCurrentUserName(userName);
            if (userAvatar) setCurrentUserAvatar(userAvatar);
        } catch (error) {
            console.error('Failed to load user info:', error);
        }
    };

    const loadMoments = async (isRefresh: boolean = false) => {
        if (loading || (isFinished && !isRefresh)) return;

        try {
            setLoading(true);
            const start = isRefresh ? 0 : (moments[moments.length - 1]?.createTime || 0);
            const count = 20;
            // direction: 0 for new, 1 for old (history)
            const direction = isRefresh ? 0 : 1;

            // If refreshing, we might want getCachedMomentList or just fetch new
            // Assuming getMomentList fetches latest if timestamp 0
            const { list, isFinished: finished } = await JuggleIMMoment.getMomentList({
                count,
                timestamp: start,
                direction
            });
            // 按照时间倒序排序
            list.sort((a, b) => b.createTime - a.createTime);

            if (isRefresh) {
                setMoments(list);
            } else {
                setMoments(prev => [...prev, ...list]);
            }
            setIsFinished(finished);

        } catch (error) {
            console.error('Failed to load moments:', error);
            Alert.alert('Error', 'Failed to load moments');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        setIsFinished(false);
        loadMoments(true);
    };

    const handleLoadMore = () => {
        if (!loading && !isFinished) {
            loadMoments(false);
        }
    };

    const handleLike = async (momentId: string, isLiked: boolean) => {
        try {
            const reactionKey = 'like';
            if (isLiked) {
                await JuggleIMMoment.removeReaction(momentId, reactionKey);
            } else {
                await JuggleIMMoment.addReaction(momentId, reactionKey);
            }

            // Update local state
            setMoments(moments.map(moment => {
                if (moment.momentId === momentId) {
                    let reactionList = moment.reactionList || [];
                    // Find 'like' reaction group
                    let likeReactionIndex = reactionList.findIndex(r => r.key === reactionKey);
                    let likeReaction = likeReactionIndex !== -1 ? reactionList[likeReactionIndex] : { key: reactionKey, userList: [] };

                    let userList = likeReaction.userList || [];

                    if (isLiked) {
                        // Remove user
                        userList = userList.filter(u => u.userId !== currentUserId);
                    } else {
                        // Add user
                        userList = [...userList, {
                            userId: currentUserId,
                            nickname: currentUserName,
                            avatar: currentUserAvatar,
                        } as UserInfo];
                    }

                    // Update reaction list
                    if (likeReactionIndex !== -1) {
                        // Create a NEW object for replacement, don't mutate
                        const newReaction = { ...likeReaction, userList };
                        // Replace in list
                        const newReactionList = [...reactionList];
                        newReactionList[likeReactionIndex] = newReaction;
                        return { ...moment, reactionList: newReactionList };
                    } else {
                        // Add new reaction group
                        return { ...moment, reactionList: [...reactionList, { key: reactionKey, userList }] };
                    }
                }
                return moment;
            }));
        } catch (error) {
            console.error('Failed to toggle like:', error);
            Alert.alert('Error', 'Failed to update like');
        }
    };

    const handleDeleteMoment = (momentId: string) => {
        Alert.alert(
            'Delete Moment',
            'Are you sure you want to delete this moment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await JuggleIMMoment.removeMoment(momentId);
                            setMoments(moments.filter(m => m.momentId !== momentId));
                        } catch (error) {
                            console.error('Failed to delete moment:', error);
                            Alert.alert('Error', 'Failed to delete moment');
                        }
                    },
                },
            ]
        );
    };

    const handleCommentPress = (momentId: string, comment?: MomentComment) => {
        setSelectedMomentId(momentId);
        setReplyToComment(comment || null);
        setCommentModalVisible(true);
    };

    const handleSendComment = async () => {
        if (!commentText.trim()) return;

        try {
            const comment = await JuggleIMMoment.addComment(
                selectedMomentId,
                replyToComment?.commentId || '',
                commentText.trim()
            );

            // Update local state
            setMoments(moments.map(moment => {
                if (moment.momentId === selectedMomentId) {
                    return {
                        ...moment,
                        commentList: [...(moment.commentList || []), comment],
                    };
                }
                return moment;
            }));

            setCommentText('');
            setCommentModalVisible(false);
            setReplyToComment(null);
        } catch (error) {
            console.error('Failed to add comment:', error);
            Alert.alert('Error', 'Failed to add comment');
        }
    };

    const handleDeleteComment = (momentId: string, commentId: string) => {
        Alert.alert(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await JuggleIMMoment.removeComment(momentId, commentId);
                            setMoments(moments.map(moment => {
                                if (moment.momentId === momentId) {
                                    return {
                                        ...moment,
                                        commentList: moment.commentList.filter(c => c.commentId !== commentId),
                                    };
                                }
                                return moment;
                            }));
                        } catch (error) {
                            console.error('Failed to delete comment:', error);
                            Alert.alert('Error', 'Failed to delete comment');
                        }
                    },
                },
            ]
        );
    };

    const handleImagePress = (medias: MomentMedia[], index: number) => {
        const images = medias.map(m => m.snapshotUrl || m.url);
        setPreviewImages(images);
        setPreviewIndex(index);
        setPreviewVisible(true);
    };

    const renderHeader = () => (
        <View style={styles.profileHeader}>
            <Image
                source={require('../assets/icons/profile_cover.png')}
                style={styles.coverImage}
            />
            <View style={styles.userInfoContainer}>
                <Text style={styles.userName}>{currentUserName}</Text>
                <Image
                    source={
                        currentUserAvatar
                            ? { uri: currentUserAvatar }
                            : require('../assets/icons/default_avatar.png')
                    }
                    style={styles.userAvatar}
                />
            </View>
            <TouchableOpacity
                style={styles.publishButton}
                onPress={() => navigation.navigate('PublishMoment', { mode: 'media' })}
                onLongPress={() => navigation.navigate('PublishMoment', { mode: 'text' })}>
                <Image
                    source={require('../assets/icons/camera.png')}
                    style={styles.publishIcon}
                />
            </TouchableOpacity>
        </View>
    );

    const renderImagePreview = () => {
        return (
            <Modal
                visible={previewVisible}
                transparent={true}
                onRequestClose={() => setPreviewVisible(false)}
            >
                <View style={styles.previewContainer}>
                    <FlatList
                        data={previewImages}
                        horizontal
                        pagingEnabled
                        initialScrollIndex={previewIndex}
                        getItemLayout={(data, index) => (
                            { length: width, offset: width * index, index }
                        )}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={() => setPreviewVisible(false)}
                                style={styles.previewItemContainer}
                            >
                                <Image
                                    source={{ uri: item }}
                                    style={styles.previewImage}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        )}
                    />
                    {previewImages.length > 1 && (
                        <View style={styles.previewIndicator}>
                            {previewImages.map((_, index) => {
                                // Simple indicator logic, ideally would track scroll position
                                return (
                                    <View
                                        key={index}
                                        style={[
                                            styles.indicatorDot,
                                            // This is static for initial index for now unless we add onScroll
                                        ]}
                                    />
                                )
                            })}
                        </View>
                    )}
                </View>
            </Modal>
        );
    };

    const renderMediaGrid = (medias: MomentMedia[]) => {
        if (!medias || medias.length === 0) return null;

        const imageWidth = medias.length === 1 ? width * 0.6 : (width - 120) / 3;

        return (
            <View style={styles.mediaGrid}>
                {medias.map((media, index) => (
                    <TouchableOpacity
                        key={index}
                        activeOpacity={0.8}
                        onPress={() => handleImagePress(medias, index)}
                        style={[
                            styles.mediaItem,
                            { width: imageWidth, height: imageWidth },
                            medias.length === 1 && styles.singleMedia,
                        ]}>
                        <Image
                            source={{ uri: media.snapshotUrl || media.url }}
                            style={styles.mediaImage}
                        />
                        {media.type === 'video' && (
                            <View style={styles.videoOverlay}>
                                <Text style={styles.videoDuration}>
                                    {Math.floor((media.duration || 0) / 60)}:{((media.duration || 0) % 60).toString().padStart(2, '0')}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderReactions = (reactions: MomentReaction[]) => {
        if (!reactions || reactions.length === 0) return null;

        const likeReaction = reactions.find(r => r.key === 'like');
        if (!likeReaction || !likeReaction.userList || likeReaction.userList.length === 0) return null;

        return (
            <View style={styles.reactionsContainer}>
                <Image
                    source={require('../assets/icons/like.png')}
                    style={styles.reactionIcon}
                />
                <Text style={styles.reactionText}>
                    {likeReaction.userList.map(u => u.nickname).join(', ')}
                </Text>
            </View>
        );
    };

    const renderComments = (comments: MomentComment[], momentId: string) => {
        if (!comments || comments.length === 0) return null;

        return (
            <View style={styles.commentsContainer}>
                {comments.map((comment) => (
                    <TouchableOpacity
                        key={comment.commentId}
                        style={styles.commentItem}
                        onPress={() => handleCommentPress(momentId, comment)}
                        onLongPress={() => {
                            if (comment.userInfo.userId === currentUserId) {
                                handleDeleteComment(momentId, comment.commentId);
                            }
                        }}>
                        <Text style={styles.commentText}>
                            <Text style={styles.commentAuthor}>{comment.userInfo.nickname}</Text>
                            {comment.parentUserInfo && (
                                <>
                                    <Text style={styles.commentReply}> 回复 </Text>
                                    <Text style={styles.commentAuthor}>{comment.parentUserInfo.nickname}</Text>
                                </>
                            )}
                            <Text>: {comment.content}</Text>
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderMomentItem = ({ item }: { item: Moment }) => {
        const likeReaction = item.reactionList?.find(r => r.key === 'like');
        const isLiked = likeReaction?.userList?.some(u => u.userId === currentUserId) || false;

        const isOwnMoment = item.userInfo?.userId === currentUserId;
        const showBubble = activeBubbleMomentId === item.momentId;

        return (
            <View style={styles.momentItem}>
                <Image
                    source={
                        item.userInfo?.avatar
                            ? { uri: item.userInfo.avatar }
                            : require('../assets/icons/default_avatar.png')
                    }
                    style={styles.momentAvatar}
                />
                <View style={styles.momentContent}>
                    <Text style={styles.momentAuthor}>{item.userInfo?.nickname}</Text>
                    {item.content ? (
                        <Text style={styles.momentText}>{item.content}</Text>
                    ) : null}
                    {renderMediaGrid(item.mediaList)}

                    {/* Time and action bubble on same line */}
                    <View style={styles.timeActionRow}>
                        <View style={styles.timeDeleteRow}>
                            <Text style={styles.momentTime}>
                                {formatRelativeTime(item.createTime)}
                            </Text>
                            {isOwnMoment && (
                                <TouchableOpacity
                                    style={styles.deleteIconButton}
                                    onPress={() => handleDeleteMoment(item.momentId)}>
                                    <Image
                                        source={require('../assets/icons/delete.png')}
                                        style={styles.deleteIcon}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.actionButtonsContainer}>
                            {showBubble && (
                                <View style={styles.bubbleMenu}>
                                    <TouchableOpacity
                                        style={styles.bubbleButton}
                                        onPress={() => {
                                            handleLike(item.momentId, isLiked);
                                            setActiveBubbleMomentId(null);
                                        }}>
                                        <Image
                                            source={require('../assets/icons/like.png')}
                                            style={styles.bubbleIcon}
                                        />
                                        <Text style={styles.bubbleText}>赞</Text>
                                    </TouchableOpacity>
                                    <View style={styles.bubbleDivider} />
                                    <TouchableOpacity
                                        style={styles.bubbleButton}
                                        onPress={() => {
                                            handleCommentPress(item.momentId);
                                            setActiveBubbleMomentId(null);
                                        }}>
                                        <Image
                                            source={require('../assets/icons/comment.png')}
                                            style={styles.bubbleIcon}
                                        />
                                        <Text style={styles.bubbleText}>评论</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            <TouchableOpacity
                                style={styles.moreButton}
                                onPress={() => setActiveBubbleMomentId(showBubble ? null : item.momentId)}>
                                <Text style={styles.moreButtonText}>•••</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {((item.reactionList && item.reactionList.length > 0) || (item.commentList && item.commentList.length > 0)) && (
                        <View style={styles.interactionsContainer}>
                            {renderReactions(item.reactionList)}
                            {renderComments(item.commentList, item.momentId)}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={moments}
                renderItem={renderMomentItem}
                keyExtractor={(item) => item.momentId}
                ListHeaderComponent={renderHeader}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                contentContainerStyle={styles.listContent}
            />

            <Modal
                visible={commentModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCommentModalVisible(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setCommentModalVisible(false)}
                    />
                    <View style={styles.commentInputContainer}>
                        {replyToComment && (
                            <View style={styles.replyToContainer}>
                                <Text style={styles.replyToText}>
                                    回复 {replyToComment.userInfo.nickname}
                                </Text>
                                <TouchableOpacity onPress={() => setReplyToComment(null)}>
                                    <Image
                                        source={require('../assets/icons/close.png')}
                                        style={styles.closeReplyIcon}
                                    />
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder={replyToComment ? '回复评论...' : '发表评论...'}
                                value={commentText}
                                onChangeText={setCommentText}
                                multiline
                                autoFocus
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    !commentText.trim() && styles.sendButtonDisabled,
                                ]}
                                onPress={handleSendComment}
                                disabled={!commentText.trim()}>
                                <Text
                                    style={[
                                        styles.sendButtonText,
                                        !commentText.trim() && styles.sendButtonTextDisabled,
                                    ]}>
                                    发送
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {renderImagePreview()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    listContent: {
        paddingBottom: 20,
    },
    profileHeader: {
        height: HEADER_HEIGHT,
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: HEADER_HEIGHT,
        resizeMode: 'cover',
    },
    userInfoContainer: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginRight: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    userAvatar: {
        width: 60,
        height: 60,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    publishButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    publishIcon: {
        width: 24,
        height: 24,
        tintColor: '#FFFFFF',
    },
    momentItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    momentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 4,
        marginRight: 12,
    },
    momentContent: {
        flex: 1,
    },
    momentAuthor: {
        fontSize: 15,
        fontWeight: '600',
        color: '#576B95',
        marginBottom: 4,
    },
    momentText: {
        fontSize: 15,
        color: '#000000',
        lineHeight: 22,
        marginBottom: 8,
    },
    timeActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    timeDeleteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    momentTime: {
        fontSize: 13,
        color: '#999999',
    },
    deleteIconButton: {
        padding: 2,
    },
    deleteIcon: {
        width: 14,
        height: 14,
        tintColor: '#999999',
    },
    actionButtonsContainer: {
        position: 'relative',
        alignItems: 'flex-end',
        flexDirection: 'row',
    },
    moreButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: '#F0F0F0',
        borderRadius: 3,
    },
    moreButtonText: {
        fontSize: 16,
        color: '#666666',
        letterSpacing: 1,
    },
    bubbleMenu: {
        position: 'absolute',
        top: 0,
        right: '100%',
        marginRight: 8,
        flexDirection: 'row',
        backgroundColor: '#5A5A5A',
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    bubbleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        gap: 6,
    },
    bubbleIcon: {
        width: 18,
        height: 18,
        tintColor: '#FFFFFF',
    },
    bubbleText: {
        fontSize: 13,
        color: '#FFFFFF',
    },
    bubbleDivider: {
        width: 1,
        backgroundColor: '#7A7A7A',
        marginVertical: 4,
    },
    deleteButton: {
        alignSelf: 'flex-start',
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    deleteButtonText: {
        fontSize: 13,
        color: '#576B95',
    },
    mediaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 4,
    },
    mediaItem: {
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#F0F0F0',
    },
    singleMedia: {
        marginRight: 0,
    },
    mediaImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    videoOverlay: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    videoDuration: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    interactionsContainer: {
        backgroundColor: '#F3F3F5',
        marginTop: 8,
        borderRadius: 4,
        paddingHorizontal: 12,
    },
    reactionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    reactionIcon: {
        width: 14,
        height: 14,
        tintColor: '#576B95',
        marginRight: 6,
    },
    reactionText: {
        fontSize: 14,
        color: '#576B95',
        flex: 1,
        lineHeight: 20,
    },
    commentsContainer: {
        paddingVertical: 4,
        paddingBottom: 8,
    },
    commentItem: {
        marginTop: 4,
    },
    commentText: {
        fontSize: 14,
        color: '#333333',
        lineHeight: 20,
    },
    commentAuthor: {
        color: '#576B95',
        fontWeight: '600',
    },
    commentReply: {
        color: '#333333',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    commentInputContainer: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    replyToContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    replyToText: {
        fontSize: 12,
        color: '#666666',
    },
    closeReplyIcon: {
        width: 16,
        height: 16,
        tintColor: '#999999',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 120,
        marginRight: 12,
    },
    sendButton: {
        backgroundColor: '#07C160',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#E5E5E5',
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    sendButtonTextDisabled: {
        color: '#A8A8A8',
    },
    previewContainer: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
    },
    previewItemContainer: {
        width: width,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: width,
        height: '100%',
        resizeMode: 'contain',
    },
    previewIndicator: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        alignSelf: 'center',
        gap: 8,
    },
    indicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
});

export default MomentScreen;
