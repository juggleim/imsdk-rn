import { getGroupInfo, GroupInfo } from '../api/groups';
import { getUserInfo, UserInfo } from '../api/users';

type CacheItem = {
    data: any;
    timestamp: number;
};

class UserInfoManager {
    private static instance: UserInfoManager;
    private userCache: Map<string, CacheItem> = new Map();
    private groupCache: Map<string, CacheItem> = new Map();
    private readonly MAX_CACHE_SIZE = 1000;

    private constructor() { }

    public static getInstance(): UserInfoManager {
        if (!UserInfoManager.instance) {
            UserInfoManager.instance = new UserInfoManager();
        }
        return UserInfoManager.instance;
    }

    private enforceCacheLimit(cache: Map<string, CacheItem>) {
        if (cache.size > this.MAX_CACHE_SIZE) {
            // Simple LRU-like: remove the oldest item (first inserted/updated)
            // Since Map preserves insertion order, we can just delete the first key.
            // However, to be truly LRU, we should re-insert on access.
            // For simplicity and performance, we'll just remove the first item in the iterator.
            const firstKey = cache.keys().next().value;
            if (firstKey) {
                cache.delete(firstKey);
            }
        }
    }

    public async getUserInfo(userId: string): Promise<UserInfo | null> {
        if (this.userCache.has(userId)) {
            const item = this.userCache.get(userId);
            // Optional: Refresh timestamp or move to end to implement LRU
            this.userCache.delete(userId);
            this.userCache.set(userId, item!);
            return item!.data as UserInfo;
        }

        try {
            const userInfo = await getUserInfo(userId);
            if (userInfo) {
                this.userCache.set(userId, { data: userInfo, timestamp: Date.now() });
                this.enforceCacheLimit(this.userCache);
                return userInfo;
            }
        } catch (error) {
            console.error(`Failed to fetch user info for ${userId}`, error);
        }
        return null;
    }

    public async getGroupInfo(groupId: string): Promise<GroupInfo | null> {
        if (this.groupCache.has(groupId)) {
            const item = this.groupCache.get(groupId);
            this.groupCache.delete(groupId);
            this.groupCache.set(groupId, item!);
            return item!.data as GroupInfo;
        }

        try {
            const groupInfo = await getGroupInfo(groupId);
            if (groupInfo) {
                this.groupCache.set(groupId, { data: groupInfo, timestamp: Date.now() });
                // Also cache members as users
                if (groupInfo.members) {
                    groupInfo.members.forEach(member => {
                        this.userCache.set(member.user_id, {
                            data: {
                                user_id: member.user_id,
                                nickname: member.nickname,
                                avatar: member.avatar,
                                // Fill other fields with defaults or partial data if needed
                                // For now, we only care about display info
                            } as any,
                            timestamp: Date.now()
                        });
                        this.enforceCacheLimit(this.userCache);
                    });
                }
                this.enforceCacheLimit(this.groupCache);
                return groupInfo;
            }
        } catch (error) {
            console.error(`Failed to fetch group info for ${groupId}`, error);
        }
        return null;
    }

    // Synchronous get for UI rendering if available
    public getUserInfoSync(userId: string): UserInfo | undefined {
        return this.userCache.get(userId)?.data;
    }

    public getGroupInfoSync(groupId: string): GroupInfo | undefined {
        return this.groupCache.get(groupId)?.data;
    }
}

export default UserInfoManager.getInstance();
