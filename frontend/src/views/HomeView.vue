<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-col-gutter-sm q-mb-md">
      <div class="col">
        <div class="text-h5">Publicaciones</div>
      </div>
      <div class="col-auto">
        <q-select v-model="sortBy" :options="options" label="Ordenar por" dense outlined style="min-width: 180px" />
      </div>
      <div class="col-auto">
        <q-btn outline dense label="Recargar" @click="loadPosts" :loading="loading" />
      </div>
    </div>

    <q-banner v-if="error" class="bg-red-2 text-red-10 q-mb-sm" dense>{{ error }}</q-banner>
    <div v-if="loading">Cargando...</div>
    <div v-if="!loading && sortedPosts.length === 0">Sin publicaciones</div>

    <!-- Populares -->
    <div class="text-subtitle1 q-mt-md q-mb-sm">Populares</div>
    <div class="row q-col-gutter-md q-mb-lg">
      <div
        v-for="p in popularPosts"
        :key="String(p._id || p.id || '')"
        class="q-ma-sm col-xs-12 col-sm-6 col-md-4"
      >
        <q-card bordered class="shadow-2 rounded-borders full-height">
          <q-card-section>
            <div class="text-subtitle2 ellipsis">{{ p.title }}</div>
            <div class="text-caption text-grey-7">Likes: {{ p.likes ?? 0 }} · Vistas: {{ p.views ?? 0 }}</div>
          </q-card-section>
          <q-img v-if="p.filePath && isImagePath(p.filePath)" :src="mediaUrl(p.filePath)" class="rounded-borders thumb-300" fit="cover" />
          <q-card-section v-else-if="p.filePath">
            <video :src="mediaUrl(p.filePath)" class="rounded-borders full-width" controls></video>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Todos -->
    <div class="text-subtitle1 q-mb-sm">Todos</div>
    <div class="row q-col-gutter-lg">
      <div v-for="p in sortedPosts" :key="String(p._id || p.id || '')" class="col-12 col-md-6">
        <q-card bordered class="q-mb-lg shadow-2 rounded-borders" @click="navigateTo(p)" clickable>
          <q-card-section>
            <div class="text-h6">{{ p.title }}</div>
            <div class="text-body2 q-mt-sm">{{ p.content }}</div>

            <!-- Media preferente por filePath; fallback a image/video -->
            <div class="q-mt-md" v-if="p.filePath || p.image || p.video">
              <template v-if="p.filePath">
                <q-img v-if="isImagePath(p.filePath)" :src="mediaUrl(p.filePath)" class="rounded-borders thumb-300" fit="cover" @error="onMediaError(p.filePath)" />
                <video v-else :src="mediaUrl(p.filePath)" controls class="rounded-borders thumb-300 q-mt-md" @error="onMediaError(p.filePath)" style="object-fit: cover;"></video>
              </template>
              <template v-else>
                <q-img v-if="p.image" :src="mediaUrl(p.image)" class="rounded-borders thumb-300" fit="cover" @error="onMediaError(p.image)" />
                <video v-else-if="p.video" :src="mediaUrl(p.video)" controls class="rounded-borders thumb-300 q-mt-md" @error="onMediaError(p.video)" style="object-fit: cover;"></video>
              </template>
            </div>

            <div class="row items-center q-gutter-sm q-mt-sm">
              <div class="col-auto text-caption text-grey-7">Fecha: {{ formatDate(p.createdAt) }}</div>
              <div class="col-auto text-caption text-grey-7">Vistas: {{ p.views ?? 0 }}</div>
              <div class="col-auto text-caption text-grey-7">Likes: {{ p.likes ?? 0 }}</div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-actions>
            <div class="row items-center q-gutter-sm">
              <q-btn class="like-btn" flat dense round icon="thumb_up" @click="onLike(p)" />
              <div class="text-caption">{{ p.likes ?? 0 }}</div>
            </div>
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePostStore, type Post } from '../stores/postStore';
import { incrementView, likePost } from '../services/api';
import { useQuasar } from 'quasar';
import { computeMediaUrl as computeUrl, isImagePath as isImg } from '../utils/media';

const store = usePostStore();
const router = useRouter();
const sortBy = ref<'fecha' | 'popularidad'>('fecha');
const options = [
  { label: 'Fecha', value: 'fecha' },
  { label: 'Popularidad', value: 'popularidad' },
];

const loading = computed(() => store.loading);
const error = computed(() => store.error);

async function loadPosts() {
  await store.fetchPosts();
}

const viewed = new Set<string>();

onMounted(async () => {
  await loadPosts();
  // Incrementar vistas una vez por post cuando se muestran
  for (const p of store.posts) {
    const id = String(p._id || p.id || '');
    if (id && !viewed.has(id)) {
      viewed.add(id);
      try {
        const res = await incrementView(id);
        p.views = res.views;
      } catch {
        // silencioso
      }
    }
  }
});

const sortedPosts = computed<Post[]>(() => {
  const arr = Array.isArray(store.posts) ? [...store.posts] : [];
  if (sortBy.value === 'popularidad') return arr.sort((a, b) => score(b) - score(a));
  return arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
});

const popularPosts = computed<Post[]>(() => {
  const arr = Array.isArray(store.posts) ? [...store.posts] : [];
  return arr.sort((a, b) => score(b) - score(a)).slice(0, 6);
});

function score(p: Post) {
  const v = Number(p.views || 0);
  const l = Number(p.likes || 0);
  return l * 3 + v;
}

function mediaUrl(path: string) { return computeUrl(path); }

function formatDate(d?: string) {
  if (!d) return '';
  try { return new Date(d).toLocaleString(); } catch { return String(d); }
}

function isImagePath(path: string) { return isImg(path); }

function navigateTo(p: Post) {
  const id = String(p._id || p.id || '');
  if (!id) return;
  void router.push({ name: 'post', params: { id } });
}

async function onLike(p: Post) {
  const id = String(p._id || p.id || '');
  if (!id) return;
  try {
    const res = await likePost(id);
    p.likes = res.likes;
  } catch {
    const $q = useQuasar();
    $q.notify({ type: 'negative', message: 'No se pudo registrar el like' });
  }
}

function onMediaError(src?: string) {
  const $q = useQuasar();
  $q.notify({ type: 'negative', message: `No se pudo cargar media: ${src || ''}` });
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  // SSR data prefetch
  async preFetch() {
    const { usePostStore: usePostStoreSSR } = await import('../stores/postStore');
    const postStore = usePostStoreSSR();
    if (!postStore.posts.length) {
      await postStore.fetchPosts();
    }
  },
});
</script>

<style scoped>
.like-btn {
  transition: transform 0.15s ease, color 0.15s ease;
}
.like-btn:hover {
  color: var(--q-primary);
  transform: translateY(-1px);
}
</style>
<style scoped>
.thumb-300 {
  width: 300px;
  height: 300px;
}
</style>
