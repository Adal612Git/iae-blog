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

    <q-card v-for="p in sortedPosts" :key="String(p._id || p.id || '')" class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1">{{ p.title }}</div>
        <div class="q-mt-sm">{{ p.content }}</div>
        <div class="q-mt-md" v-if="p.image || p.video">
          <img v-if="p.image" :src="mediaUrl(p.image)" style="max-width: 100%" />
          <video v-else-if="p.video" :src="mediaUrl(p.video)" controls style="max-width: 100%"></video>
        </div>
        <div class="text-caption text-grey-7 q-mt-sm">
          <span>Fecha: {{ formatDate(p.createdAt) }}</span>
          <span class="q-ml-md">Vistas: {{ p.views ?? 0 }}</span>
          <span class="q-ml-md">Likes: {{ p.likes ?? 0 }}</span>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePostStore, type Post } from '../stores/postStore';

const store = usePostStore();
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

onMounted(loadPosts);

const sortedPosts = computed<Post[]>(() => {
  const arr = Array.isArray(store.posts) ? [...store.posts] : [];
  if (sortBy.value === 'popularidad') return arr.sort((a, b) => score(b) - score(a));
  return arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
});

function score(p: Post) {
  const v = Number(p.views || 0);
  const l = Number(p.likes || 0);
  return l * 3 + v;
}

function mediaUrl(path: string) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `http://localhost:5000${path.startsWith('/') ? path : '/' + path}`;
}

function formatDate(d?: string) {
  if (!d) return '';
  try { return new Date(d).toLocaleString(); } catch { return String(d); }
}
</script>

<style scoped></style>
