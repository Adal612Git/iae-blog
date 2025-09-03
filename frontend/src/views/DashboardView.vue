<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Dashboard</div>

    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1">Crear post</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form @submit.prevent="onCreate" class="q-gutter-md">
          <q-input v-model="form.title" label="Título" required />
          <q-input v-model="form.content" label="Contenido" type="textarea" autogrow required />
          <input type="file" @change="onFileChange($event, 'create')" />
          <q-btn type="submit" color="primary" :loading="loadingCreate" label="Crear" />
          <q-banner v-if="errorCreate" class="bg-red-2 text-red-10" dense>{{ errorCreate }}</q-banner>
        </q-form>
      </q-card-section>
    </q-card>

    <div>
      <div class="text-subtitle1 q-mb-sm">Publicaciones</div>
      <q-btn outline dense label="Recargar" @click="loadPosts" :loading="loadingList" class="q-mb-sm" />
      <q-banner v-if="errorList" class="bg-red-2 text-red-10" dense>{{ errorList }}</q-banner>

      <q-card v-for="p in posts" :key="String(p._id || p.id || '')" class="q-mb-md">
        <q-card-section v-if="editingId === (p._id ?? p.id ?? null)">
          <q-form @submit.prevent="onUpdate" class="q-gutter-md">
            <q-input v-model="editForm.title" label="Título" required />
            <q-input v-model="editForm.content" label="Contenido" type="textarea" autogrow required />
            <input type="file" @change="onFileChange($event, 'edit')" />
            <div class="row q-col-gutter-sm">
              <div class="col-auto"><q-btn type="submit" color="primary" :loading="loadingUpdate" label="Guardar" /></div>
              <div class="col-auto"><q-btn flat label="Cancelar" @click="cancelEdit" /></div>
            </div>
            <q-banner v-if="errorUpdate" class="bg-red-2 text-red-10" dense>{{ errorUpdate }}</q-banner>
          </q-form>
        </q-card-section>

        <template v-else>
          <q-card-section>
            <div class="text-subtitle1">{{ p.title }}</div>
            <div class="q-mt-sm">{{ p.content }}</div>
            <div class="q-mt-sm" v-if="p.filePath"><code>{{ p.filePath }}</code></div>
          </q-card-section>
          <q-separator />
          <q-card-actions>
            <q-btn flat label="Editar" @click="startEdit(p)" />
            <q-btn flat color="negative" :loading="loadingDeleteId === (p._id ?? p.id ?? null)" label="Eliminar" @click="onDelete(p)" />
          </q-card-actions>
        </template>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { usePostStore, type Post } from '../stores/postStore';

const postStore = usePostStore();

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

function onFileChange(ev: Event, kind: 'create' | 'edit') {
  const input = ev.target as HTMLInputElement;
  const file = input?.files?.[0] || null;
  if (kind === 'create') createFile.value = file;
  else editFile.value = file;
}

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
    cancelEdit();
  } catch (e: unknown) {
    errorUpdate.value = e instanceof Error ? e.message : 'No se pudo actualizar el post';
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
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : 'No se pudo eliminar');
  } finally {
    loadingDeleteId.value = null;
  }
}
</script>

<style scoped></style>
