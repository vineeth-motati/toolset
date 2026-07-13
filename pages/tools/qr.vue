<template>
    <ToolLayout size="narrow">
        <template #actions>
            <BaseButton
                v-if="qrCodeDataUrl"
                variant="secondary"
                icon="mdi:download"
                size="sm"
                @click="downloadQRCode"
            >
                Download
            </BaseButton>
            <BaseButton
                v-if="qrCodeDataUrl"
                variant="secondary"
                icon="mdi:share-variant"
                size="sm"
                @click="shareQRCode"
            >
                Share
            </BaseButton>
        </template>

        <BaseCard>
            <BaseInput
                v-model="text"
                label="Enter text or URL"
                placeholder="https://example.com"
            />

            <div v-if="qrCodeDataUrl" key="qr" class="flex justify-center mt-6">
                <img
                    :src="qrCodeDataUrl"
                    alt="QR Code"
                    class="rounded-lg border border-gray-100 dark:border-gray-700"
                />
            </div>
            <BaseEmptyState
                v-else
                key="empty"
                icon="mdi:qrcode"
                title="No QR code yet"
                description="Type a URL or text above to generate one."
            />
        </BaseCard>
    </ToolLayout>
</template>

<script setup>
import QRCode from 'qrcode';
import { ref, watch } from 'vue';

const text = ref('');
const qrCodeDataUrl = ref('');

const { generateShareLink, getSharedData } = useShareLink();
const toast = useToast();

watch(text, async (newText) => {
    if (newText) {
        qrCodeDataUrl.value = await QRCode.toDataURL(newText);
    } else {
        qrCodeDataUrl.value = '';
    }
});

onMounted(async () => {
    const shared = await getSharedData();
    if (shared?.qrCode) {
        text.value = shared.qrCode;
    }
});

const shareQRCode = async () => {
    const link = await generateShareLink('/tools/qr', { qrCode: text.value });
    if (link) {
        navigator.clipboard.writeText(link);
        toast.success('Share link copied to clipboard!');
    } else {
        toast.error('Failed to generate share link');
    }
};

const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeDataUrl.value;
    link.download = 'qr-code.png';
    link.click();
};
</script>
