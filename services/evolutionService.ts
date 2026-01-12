import axios from 'axios';

const EVOLUTION_API_BASE = import.meta.env.VITE_EVOLUTION_API_URL;
const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY;

interface CreateInstanceResponse {
    instance: {
        instanceName: string;
        instanceId: string;
        webhook: string;
        state: string;
    };
    qrcode?: {
        base64: string;
        code: string;
    };
}

interface ConnectInstanceResponse {
    base64?: string;
    code?: string;
    count?: number;
}

interface ConnectionStateResponse {
    instance: {
        state: 'open' | 'close' | 'connecting';
        statusReason: number;
    };
}

export const evolutionService = {
    // Helper to generate token in the format hex-dash-phone as per previous n8n logic
    generateToken: (rawPhoneNumber: string): string => {
        const randomHex = (len: number) =>
            Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();

        const apiKey = `${randomHex(12)}-${randomHex(4)}-${randomHex(4)}-${randomHex(12)}`;
        // Use only digits for the suffix - usually matches the raw user input without DDI
        return `${apiKey}-${rawPhoneNumber.replace(/\D/g, '')}`;
    },

    // 1. Create Instance Direct via Evolution API
    createInstance: async (phoneNumber: string, agentId: string, companyId: string, token?: string) => {
        try {
            const url = `${EVOLUTION_API_BASE}/instance/create`;
            console.log('Evolution API Request (POST):', url);
            const response = await axios.post(url, {
                instanceName: agentId,
                token: token || agentId,
                number: phoneNumber,
                qrcode: true,
                integration: "WHATSAPP-BAILEYS" // Required for Evolution v2.x
            }, {
                headers: {
                    apikey: API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating instance:', error);
            throw error;
        }
    },

    // 2. Set Webhook Configuration
    setWebhook: async (instanceName: string, webhookUrl: string) => {
        try {
            const url = `${EVOLUTION_API_BASE}/webhook/set/${instanceName}`;
            console.log('Evolution API Request (POST):', url);
            const response = await axios.post(url, {
                url: webhookUrl,
                webhook_by_events: false,
                webhook_base64: true,
                events: ["MESSAGES_UPSERT"]
            }, {
                headers: {
                    apikey: API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error setting webhook:', error);
            throw error;
        }
    },

    // 3. Set Instance Settings (Behavior)
    setSettings: async (instanceName: string, settings: any) => {
        try {
            const url = `${EVOLUTION_API_BASE}/settings/set/${instanceName}`;
            console.log('Evolution API Request (POST):', url);
            const response = await axios.post(url, {
                reject_call: settings.rejectCall ?? true,
                groups_ignore: settings.groupsIgnore ?? true,
                always_online: settings.always_online ?? true,
                read_messages: settings.read_messages ?? true
            }, {
                headers: {
                    apikey: API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error setting settings:', error);
            throw error;
        }
    },

    // 4. Connect Instance (Get QR Code)
    connectInstance: async (instanceName: string, phoneNumber?: string): Promise<ConnectInstanceResponse> => {
        try {
            const url = `${EVOLUTION_API_BASE}/instance/connect/${instanceName}`;
            console.log('Evolution API Request (GET):', url);
            const response = await axios.get(url, {
                headers: {
                    apikey: API_KEY
                },
                params: {
                    number: phoneNumber
                }
            });

            // Evolution API can return { base64: "...", code: "..." }
            // OR sometimes nested { qrcode: { base64: "...", code: "..." } } depending on version/config
            const data = response.data;

            if (data.qrcode) {
                return {
                    base64: data.qrcode.base64 || data.base64,
                    code: data.qrcode.code || data.code,
                    count: data.qrcode.count || data.count
                };
            }

            return data;
        } catch (error) {
            console.error('Error connecting instance:', error);
            throw error;
        }
    },

    // 5. Get Connection State
    getConnectionState: async (instanceName: string): Promise<ConnectionStateResponse> => {
        try {
            const response = await axios.get(`${EVOLUTION_API_BASE}/instance/connectionState/${instanceName}`, {
                headers: {
                    apikey: API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting connection state:', error);
            throw error;
        }
    },

    // 6. Delete Instance
    deleteInstance: async (instanceName: string) => {
        try {
            const response = await axios.delete(`${EVOLUTION_API_BASE}/instance/delete/${instanceName}`, {
                headers: {
                    apikey: API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting instance:', error);
            throw error;
        }
    }
};
