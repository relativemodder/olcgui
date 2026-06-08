import { VK } from 'vk-io';
import { VK_TOKEN, VK_GROUP_ID } from './config';

const pollingGroupId = VK_GROUP_ID ? Number(VK_GROUP_ID) : undefined;

export const vk = new VK({ token: VK_TOKEN, pollingGroupId });
