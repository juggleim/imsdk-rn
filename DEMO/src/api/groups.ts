import { fetchData } from './client';

export interface GroupMember {
    user_id: string;
    nickname: string;
    avatar: string;
    member_type: number; // 0:普通用户；1：机器人；
    role: number; // 0:群成员；1：群主；2：群管理员
}

export interface GroupInfo {
    group_id: string;
    group_name: string;
    group_portrait: string;
    member_count: number;
    members: GroupMember[];
    owner: {
        user_id: string;
        nickname: string;
        avatar: string;
    };
    my_role: number; // 0：普通群成员；1：群主；2：群管理员；
    group_management: {
        group_mute: number;
        max_admin_count: number;
        admin_count: number;
        group_verify_type: number;
    };
    grp_display_name: string;
}

export async function getGroupInfo(group_id: string): Promise<GroupInfo> {
    return fetchData<GroupInfo>({
        url: '/jim/groups/info',
        method: 'GET',
        params: {
            group_id
        }
    });
}

export interface GroupAnnouncement {
    group_id: string;
    content: string;
}

export async function inviteGroupMembers(group_id: string, member_ids: string[]): Promise<void> {
    return fetchData<void>({
        url: '/jim/groups/invite',
        method: 'POST',
        data: {
            group_id,
            member_ids
        }
    });
}

export async function removeGroupMembers(group_id: string, member_ids: string[]): Promise<void> {
    return fetchData<void>({
        url: '/jim/groups/members/del',
        method: 'POST',
        data: {
            group_id,
            member_ids
        }
    });
}

export async function setGroupAnnouncement(group_id: string, content: string): Promise<void> {
    return fetchData<void>({
        url: '/jim/groups/setgrpannouncement',
        method: 'POST',
        data: {
            group_id,
            content
        }
    });
}

export async function getGroupAnnouncement(group_id: string): Promise<GroupAnnouncement> {
    return fetchData<GroupAnnouncement>({
        url: '/jim/groups/getgrpannouncement',
        method: 'GET',
        params: {
            group_id
        }
    });
}

export interface CreateGroupRequest {
    group_name: string;
    group_portrait?: string;
    member_ids: string[];
}

export interface CreateGroupResponse {
    group_id: string;
    group_name: string;
    group_portrait: string;
}

export async function createGroup(request: CreateGroupRequest): Promise<CreateGroupResponse> {
    return fetchData<CreateGroupResponse>({
        url: '/jim/groups/create',
        method: 'POST',
        data: request
    });
}

export interface UpdateGroupRequest {
    group_id: string;
    group_name?: string;
    group_portrait?: string;
}

export async function updateGroupInfo(request: UpdateGroupRequest): Promise<void> {
    return fetchData<void>({
        url: '/jim/groups/update',
        method: 'POST',
        data: request
    });
}
