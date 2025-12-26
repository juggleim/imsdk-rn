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
    getMomentList,
    deleteMoment,
    addComment,
    deleteComment,
    addReaction,
    deleteReaction,
    MomentItem,
    Comment,
} from '../api/moment';
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

    const [moments, setMoments] = useState<MomentItem[]>([]);
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
    const [replyToComment, setReplyToComment] = useState<Comment | null>(null);

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
            const start = isRefresh ? 0 : (moments[moments.length - 1]?.moment_time || 0);
            const response = await getMomentList(20, start);

            if (isRefresh) {
                setMoments(response.items);
            } else {
                setMoments([...moments, ...response.items]);
            }
            setIsFinished(response.is_finished);
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
            if (isLiked) {
                await deleteReaction(momentId, 'like');
            } else {
                await addReaction(momentId, { key: 'like', value: 'like_v' });
            }

            // Update local state
            setMoments(moments.map(moment => {
                if (moment.moment_id === momentId) {
                    const reactions = isLiked
                        ? moment.reactions.filter(r => r.user_info.user_id !== currentUserId)
                        : [...moment.reactions, {
                            value: '👍',
                            timestamp: Date.now(),
                            user_info: {
                                user_id: currentUserId,
                                nickname: currentUserName,
                                avatar: currentUserAvatar,
                            },
                        }];
                    return { ...moment, reactions };
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
                            await deleteMoment([momentId]);
                            setMoments(moments.filter(m => m.moment_id !== momentId));
                        } catch (error) {
                            console.error('Failed to delete moment:', error);
                            Alert.alert('Error', 'Failed to delete moment');
                        }
                    },
                },
            ]
        );
    };

    const handleCommentPress = (momentId: string, comment?: Comment) => {
        setSelectedMomentId(momentId);
        setReplyToComment(comment || null);
        setCommentModalVisible(true);
    };

    const handleSendComment = async () => {
        if (!commentText.trim()) return;

        try {
            const response = await addComment(
                selectedMomentId,
                commentText.trim(),
                replyToComment?.comment_id
            );

            // Update local state
            setMoments(moments.map(moment => {
                if (moment.moment_id === selectedMomentId) {
                    const newComment: Comment = {
                        comment_id: response.comment_id,
                        moment_id: selectedMomentId,
                        parent_comment_id: replyToComment?.comment_id,
                        content: { text: commentText.trim() },
                        user_info: response.user_info,
                        parent_user_info: replyToComment?.user_info,
                        comment_time: response.comment_time,
                    };
                    return {
                        ...moment,
                        top_comments: [...moment.top_comments, newComment],
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
                            await deleteComment(momentId, [commentId]);
                            setMoments(moments.map(moment => {
                                if (moment.moment_id === momentId) {
                                    return {
                                        ...moment,
                                        top_comments: moment.top_comments.filter(c => c.comment_id !== commentId),
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

    const handleImagePress = (medias: any[], index: number) => {
        const images = medias.map(m => m.snapshot_url || m.url);
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
                            : require('../assets/icons/avatar.png')
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

    const renderMediaGrid = (medias: any[]) => {
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
                            source={{ uri: media.snapshot_url || media.url }}
                            style={styles.mediaImage}
                        />
                        {media.type === 'video' && (
                            <View style={styles.videoOverlay}>
                                <Text style={styles.videoDuration}>
                                    {Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderReactions = (reactions: any[]) => {
        if (!reactions || reactions.length === 0) return null;

        return (
            <View style={styles.reactionsContainer}>
                <Image
                    source={require('../assets/icons/like.png')}
                    style={styles.reactionIcon}
                />
                <Text style={styles.reactionText}>
                    {reactions.map(r => r.user_info.nickname).join(', ')}
                </Text>
            </View>
        );
    };

    const renderComments = (comments: Comment[], momentId: string) => {
        if (!comments || comments.length === 0) return null;

        return (
            <View style={styles.commentsContainer}>
                {comments.map((comment) => (
                    <TouchableOpacity
                        key={comment.comment_id}
                        style={styles.commentItem}
                        onPress={() => handleCommentPress(momentId, comment)}
                        onLongPress={() => {
                            if (comment.user_info.user_id === currentUserId) {
                                handleDeleteComment(momentId, comment.comment_id);
                            }
                        }}>
                        <Text style={styles.commentText}>
                            <Text style={styles.commentAuthor}>{comment.user_info.nickname}</Text>
                            {comment.parent_user_info && (
                                <>
                                    <Text style={styles.commentReply}> 回复 </Text>
                                    <Text style={styles.commentAuthor}>{comment.parent_user_info.nickname}</Text>
                                </>
                            )}
                            <Text>: {comment.content.text}</Text>
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderMomentItem = ({ item }: { item: MomentItem }) => {
        const isLiked = item.reactions.some(r => r.user_info.user_id === currentUserId);
        const isOwnMoment = item.user_info.user_id === currentUserId;
        const showBubble = activeBubbleMomentId === item.moment_id;

        return (
            <View style={styles.momentItem}>
                <Image
                    source={
                        item.user_info.avatar
                            ? { uri: item.user_info.avatar }
                            : require('../assets/icons/avatar.png')
                    }
                    style={styles.momentAvatar}
                />
                <View style={styles.momentContent}>
                    <Text style={styles.momentAuthor}>{item.user_info.nickname}</Text>
                    {item.content.text ? (
                        <Text style={styles.momentText}>{item.content.text}</Text>
                    ) : null}
                    {renderMediaGrid(item.content.medias)}

                    {/* Time and action bubble on same line */}
                    <View style={styles.timeActionRow}>
                        <View style={styles.timeDeleteRow}>
                            <Text style={styles.momentTime}>
                                {formatRelativeTime(item.moment_time)}
                            </Text>
                            {isOwnMoment && (
                                <TouchableOpacity
                                    style={styles.deleteIconButton}
                                    onPress={() => handleDeleteMoment(item.moment_id)}>
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
                                            handleLike(item.moment_id, isLiked);
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
                                            handleCommentPress(item.moment_id);
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
                                onPress={() => setActiveBubbleMomentId(showBubble ? null : item.moment_id)}>
                                <Text style={styles.moreButtonText}>•••</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {(item.reactions.length > 0 || item.top_comments.length > 0) && (
                        <View style={styles.interactionsContainer}>
                            {renderReactions(item.reactions)}
                            {renderComments(item.top_comments, item.moment_id)}
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
                keyExtractor={(item) => item.moment_id}
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
                                    回复 {replyToComment.user_info.nickname}
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
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
    },
    videoDuration: {
        fontSize: 11,
        color: '#FFFFFF',
    },
    interactionsContainer: {
        marginTop: 8,
        backgroundColor: '#F7F7F7',
        borderRadius: 4,
        padding: 8,
    },
    reactionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        marginBottom: 8,
    },
    reactionIcon: {
        width: 18,
        height: 18,
        marginRight: 8,
    },
    reactionAvatars: {
        flexDirection: 'row',
        marginRight: 8,
    },
    reactionAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    reactionText: {
        flex: 1,
        fontSize: 13,
        color: '#576B95',
    },
    commentsContainer: {
        marginTop: 4,
    },
    commentItem: {
        marginBottom: 4,
    },
    commentText: {
        fontSize: 14,
        color: '#000000',
        lineHeight: 20,
    },
    commentAuthor: {
        color: '#576B95',
        fontWeight: '500',
    },
    commentReply: {
        color: '#999999',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    // Preview styles
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
        width: '100%',
        height: '100%',
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
    commentInputContainer: {
        backgroundColor: '#FFFFFF',
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    replyToContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F7F7F7',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    replyToText: {
        fontSize: 14,
        color: '#576B95',
    },
    closeReplyIcon: {
        width: 16,
        height: 16,
        tintColor: '#999999',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    commentInput: {
        flex: 1,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 15,
        backgroundColor: '#F7F7F7',
    },
    sendButton: {
        marginLeft: 12,
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: '#007AFF',
        borderRadius: 20,
    },
    sendButtonDisabled: {
        backgroundColor: '#E5E5E5',
    },
    sendButtonText: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    sendButtonTextDisabled: {
        color: '#999999',
    },
});

export default MomentScreen;
