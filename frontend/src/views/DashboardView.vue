<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Dashboard</div>

    <q-card class="q-mb-lg shadow-2 rounded-borders" bordered>
      <q-card-section>
        <div class="text-h6">Crear publicación</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form @submit.prevent="onCreate" class="q-gutter-md">
          <q-input v-model="form.title" label="Título" outlined dense required />
          <q-input v-model="form.content" label="Contenido" type="textarea" autogrow outlined dense required />
          <q-file v-model="createFile" label="Subir imagen o video" filled dense accept="image/*,video/*" use-chips clear-icon="close" :max-file-size="10485760">
            <template #prepend>
              <q-icon name="upload" />
            </template>
          </q-file>
          <q-btn type="submit" color="primary" unelevated rounded class="q-mt-md" :loading="loadingCreate" label="CREAR" />
          <q-banner v-if="errorCreate" class="bg-red-2 text-red-10" dense>{{ errorCreate }}</q-banner>
        </q-form>
      </q-card-section>
    </q-card>

    <div>
      <div class="text-subtitle1 q-mb-sm">Publicaciones</div>
      <q-btn outline dense label="Recargar" @click="loadPosts" :loading="loadingList" class="q-mb-sm" />
      <q-banner v-if="errorList" class="bg-red-2 text-red-10" dense>{{ errorList }}</q-banner>

      <q-card v-for="p in posts" :key="String(p._id || p.id || '')" class="q-mb-lg shadow-2 rounded-borders" bordered>
        <q-card-section v-if="editingId === (p._id ?? p.id ?? null)">
          <q-form @submit.prevent="onUpdate" class="q-gutter-md">
            <q-input v-model="editForm.title" label="Título" outlined dense required />
            <q-input v-model="editForm.content" label="Contenido" type="textarea" autogrow outlined dense required />
            <q-file v-model="editFile" label="Subir imagen o video (opcional)" filled dense accept="image/*,video/*" use-chips clear-icon="close">
              <template #prepend>
                <q-icon name="upload" />
              </template>
            </q-file>
            <div class="row q-col-gutter-sm">
              <div class="col-auto"><q-btn type="submit" color="primary" unelevated rounded :loading="loadingUpdate" label="Guardar" /></div>
              <div class="col-auto"><q-btn flat rounded label="Cancelar" @click="cancelEdit" /></div>
            </div>
            <q-banner v-if="errorUpdate" class="bg-red-2 text-red-10" dense>{{ errorUpdate }}</q-banner>
          </q-form>
        </q-card-section>

        <template v-else>
          <q-card-section>
            <div class="text-h6">{{ p.title }}</div>
            <div class="text-body2 q-mt-sm">{{ p.content }}</div>
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
          </q-card-section>
          <q-separator />
          <q-card-actions align="between">
            <div class="row items-center q-gutter-sm">
              <q-btn class="like-btn" flat dense round icon="thumb_up" @click="onLike(p)" />
              <div class="text-caption">{{ p.likes ?? 0 }}</div>
            </div>
            <div>
              <q-btn flat dense icon="edit" label="Editar" @click="startEdit(p)" />
              <q-btn flat dense icon="delete" color="negative" :loading="loadingDeleteId === (p._id ?? p.id ?? null)" label="Eliminar" @click="onDelete(p)" />
            </div>
          </q-card-actions>
        </template>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { usePostStore, type Post } from '../stores/postStore';
import { likePost } from '../services/api';
import { useQuasar } from 'quasar';
import { computeMediaUrl as computeUrl, isImagePath as isImg } from '../utils/media';

const postStore = usePostStore();
const $q = useQuasar();

// Listado
const posts = computed<Post[]>(() => postStore.posts);
const loadingList = ref(false);
const errorList = ref('');

async function loadPosts() {
  loadingList.value = true;
  errorList.value = '';
  try {
    await postStore.fetchPosts();
  } catch (e: unknown) {
    let msg = 'No se pudieron cargar los posts';
    if (typeof e === 'object' && e && 'response' in e) {
      const r = (e as { response?: { data?: { message?: unknown } } }).response;
      const m = r?.data?.message;
      msg = typeof m === 'string' ? m : msg;
    } else if (e instanceof Error) {
      msg = e.message;
    }
    errorList.value = msg;
  } finally {
    loadingList.value = false;
  }
}

onMounted(loadPosts);

// Crear
const form = reactive({ title: '', content: '' });
const createFile = ref<File | null>(null);
const loadingCreate = ref(false);
const errorCreate = ref('');

// q-file usa v-model directamente, no hace falta onFileChange

async function onCreate() {
  loadingCreate.value = true;
  errorCreate.value = '';
  try {
    const payload: { title: string; content: string; file?: File | null } = {
      title: form.title,
      content: form.content,
      ...(createFile.value ? { file: createFile.value } : {}),
    };
    await postStore.createPost(payload);
    $q.notify({ type: 'positive', message: 'Publicación creada' });
    form.title = '';
    form.content = '';
    createFile.value = null;
  } catch (e: unknown) {
    let msg = 'No se pudo crear el post';
    if (typeof e === 'object' && e && 'response' in e) {
      const r = (e as { response?: { data?: { message?: unknown } } }).response;
      const m = r?.data?.message;
      msg = typeof m === 'string' ? m : msg;
    } else if (e instanceof Error) {
      msg = e.message;
    }
    errorCreate.value = msg;
    $q.notify({ type: 'negative', message: msg });
  } finally {
    loadingCreate.value = false;
  }
}

// Editar
const editingId = ref<string | number | null>(null);
const editForm = reactive({ title: '', content: '' });
const editFile = ref<File | null>(null);
const loadingUpdate = ref(false);
const errorUpdate = ref('');

function startEdit(p: Post) {
  editingId.value = (p._id ?? p.id) ?? null;
  editForm.title = p.title || '';
  editForm.content = p.content || '';
  editFile.value = null;
}

function cancelEdit() {
  editingId.value = null;
  editForm.title = '';
  editForm.content = '';
  editFile.value = null;
  errorUpdate.value = '';
}

async function onUpdate() {
  if (!editingId.value) return;
  loadingUpdate.value = true;
  errorUpdate.value = '';
  try {
    const payload: { title?: string; content?: string; file?: File | null } = {
      title: editForm.title,
      content: editForm.content,
      ...(editFile.value ? { file: editFile.value } : {}),
    };
    await postStore.updatePost(editingId.value, payload);
    $q.notify({ type: 'positive', message: 'Publicación actualizada' });
    cancelEdit();
  } catch (e: unknown) {
    errorUpdate.value = e instanceof Error ? e.message : 'No se pudo actualizar el post';
    $q.notify({ type: 'negative', message: errorUpdate.value });
  } finally {
    loadingUpdate.value = false;
  }
}

// Eliminar
const loadingDeleteId = ref<string | number | null>(null);
async function onDelete(p: Post) {
  const id = p._id || p.id;
  if (!id) return;
  loadingDeleteId.value = id;
  try {
    await postStore.deletePost(id);
    $q.notify({ type: 'warning', message: 'Publicación eliminada' });
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : 'No se pudo eliminar');
  } finally {
    loadingDeleteId.value = null;
  }
}

function mediaUrl(path: string) { return computeUrl(path); }
function isImagePath(path: string) { return isImg(path); }

async function onLike(p: Post) {
  const id = String(p._id || p.id || '');
  if (!id) return;
  try {
    const res = await likePost(id);
    p.likes = res.likes;
  } catch {
    // ignore
  }
}

function onMediaError(src?: string) {
  $q.notify({ type: 'negative', message: `No se pudo cargar media: ${src || ''}` });
}
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
