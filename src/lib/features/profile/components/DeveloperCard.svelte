<script lang="ts">
	import { developerStore } from '../developer.config';
	import Badge from '../../../shared/ui/Badge.svelte';
	import Modal from '../../../shared/ui/Modal.svelte';
	import Icon from '../../../shared/ui/Icon.svelte';

	let isEditing = $state(false);
	let fileInputRef = $state<HTMLInputElement | null>(null);

	let editName = $state(developerStore.profile.name);
	let editRole = $state(developerStore.profile.role);
	let editInstitution = $state(developerStore.profile.institution);
	let editCourse = $state(developerStore.profile.course);
	let editEmail = $state(developerStore.profile.email);
	let editGithub = $state(developerStore.profile.githubUrl);

	function openEdit() {
		editName = developerStore.profile.name;
		editRole = developerStore.profile.role;
		editInstitution = developerStore.profile.institution;
		editCourse = developerStore.profile.course;
		editEmail = developerStore.profile.email;
		editGithub = developerStore.profile.githubUrl;
		isEditing = true;
	}

	function saveProfile() {
		developerStore.save({
			name: editName.trim() || 'Estudiante / Desarrollador',
			role: editRole.trim() || 'Desarrollador',
			institution: editInstitution.trim() || 'Institución Académica',
			course: editCourse.trim() || 'Desarrollo Web3',
			email: editEmail.trim(),
			githubUrl: editGithub.trim()
		});
		isEditing = false;
	}

	function handlePhotoSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		// Previsualización local exclusivamente en memoria del navegador
		const reader = new FileReader();
		reader.onload = (event) => {
			const result = event.target?.result as string;
			developerStore.setPhoto(result);
		};
		reader.readAsDataURL(file);
	}

	function triggerFileInput() {
		fileInputRef?.click();
	}

	function removePhoto() {
		developerStore.setPhoto(null);
		if (fileInputRef) fileInputRef.value = '';
	}
</script>

<div class="developer-card">
	<div class="card-status-bar">
		<div class="status-left">
			<Badge variant={developerStore.profile.isCustomized ? 'success' : 'warning'} size="sm">
				{developerStore.profile.isCustomized ? 'Personalizado' : 'Requisito Parcial'}
			</Badge>
			<span class="status-note">
				{developerStore.profile.photoUrl ? 'Foto local cargada' : 'Espacio pendiente para foto real'}
			</span>
		</div>
		<div class="status-actions">
			<button class="btn-text" onclick={openEdit}>
				<Icon name="edit" size={14} />
				<span>Editar Datos</span>
			</button>
			{#if developerStore.profile.isCustomized || developerStore.profile.photoUrl}
				<button class="btn-text-danger" onclick={() => developerStore.reset()}>
					Restablecer
				</button>
			{/if}
		</div>
	</div>

	<div class="profile-layout">
		<!-- Espacio para Fotografía con Previsualización Local -->
		<div class="photo-container">
			<input
				type="file"
				accept="image/*"
				bind:this={fileInputRef}
				onchange={handlePhotoSelect}
				style="display: none;"
				aria-label="Cargar foto local"
			/>

			{#if developerStore.profile.photoUrl}
				<div class="photo-preview-box">
					<img
						src={developerStore.profile.photoUrl}
						alt="Fotografía del desarrollador"
						class="photo-img"
					/>
					<div class="photo-overlay">
						<button class="overlay-btn" onclick={triggerFileInput} title="Cambiar foto">
							<Icon name="refresh" size={13} />
							<span>Cambiar</span>
						</button>
						<button class="overlay-btn danger" onclick={removePhoto} title="Eliminar foto">
							<Icon name="trash" size={13} />
							<span>Quitar</span>
						</button>
					</div>
				</div>
			{:else}
				<button class="photo-placeholder" onclick={triggerFileInput} type="button">
					<div class="placeholder-icon">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
							<circle cx="12" cy="7" r="4"/>
						</svg>
					</div>
					<span class="placeholder-tag">[Pendiente: Foto Real]</span>
					<span class="placeholder-help">Clic para previsualizar foto local (sin subir a servidores)</span>
				</button>
			{/if}
		</div>

		<!-- Datos del Desarrollador -->
		<div class="profile-details">
			<h3 class="profile-name">{developerStore.profile.name}</h3>
			<p class="profile-role">{developerStore.profile.role}</p>

			<div class="info-grid">
				<div class="info-item">
					<span class="item-label">Institución:</span>
					<span class="item-value">{developerStore.profile.institution}</span>
				</div>
				<div class="info-item">
					<span class="item-label">Curso / Asignatura:</span>
					<span class="item-value">{developerStore.profile.course}</span>
				</div>
				<div class="info-item">
					<span class="item-label">Contacto:</span>
					<span class="item-value">{developerStore.profile.email}</span>
				</div>
				<div class="info-item">
					<span class="item-label">Repositorio / Web:</span>
					<a href={developerStore.profile.githubUrl} target="_blank" rel="noopener noreferrer" class="link-item">
						{developerStore.profile.githubUrl}
					</a>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Modal de Edición de Datos del Desarrollador -->
<Modal isOpen={isEditing} title="Personalizar Datos del Desarrollador" onClose={() => (isEditing = false)}>
	<form onsubmit={(e) => { e.preventDefault(); saveProfile(); }} class="edit-form">
		<p class="form-desc">
			Configura tus datos reales para la evaluación académica. Estos datos se almacenan exclusivamente en tu navegador (LocalStorage).
		</p>

		<div class="field-group">
			<label for="dev-name">Nombres y Apellidos:</label>
			<input id="dev-name" type="text" bind:value={editName} required placeholder="Ej. Leonardo Huamán" />
		</div>

		<div class="field-group">
			<label for="dev-role">Rol / Título:</label>
			<input id="dev-role" type="text" bind:value={editRole} placeholder="Ej. Estudiante de Ingeniería de Software" />
		</div>

		<div class="field-group">
			<label for="dev-inst">Institución Educativa:</label>
			<input id="dev-inst" type="text" bind:value={editInstitution} placeholder="Ej. Universidad / Instituto" />
		</div>

		<div class="field-group">
			<label for="dev-course">Curso / Proyecto:</label>
			<input id="dev-course" type="text" bind:value={editCourse} placeholder="Ej. Taller de Microfinanzas Descentralizadas" />
		</div>

		<div class="field-group">
			<label for="dev-email">Correo Electrónico:</label>
			<input id="dev-email" type="email" bind:value={editEmail} placeholder="correo@ejemplo.edu.pe" />
		</div>

		<div class="field-group">
			<label for="dev-github">Enlace GitHub / Portafolio:</label>
			<input id="dev-github" type="url" bind:value={editGithub} placeholder="https://github.com/usuario" />
		</div>

		<div class="form-buttons">
			<button type="button" class="btn-cancel" onclick={() => (isEditing = false)}>Cancelar</button>
			<button type="submit" class="btn-submit">Guardar Cambios</button>
		</div>
	</form>
</Modal>

<style>
	.developer-card {
		background: var(--surface-inset);
		border: 1px solid var(--border-card);
		border-radius: 20px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		position: relative;
		backdrop-filter: blur(12px);
		box-shadow:none;
	}

	.card-status-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 10px;
		padding-bottom: 14px;
		border-bottom: 1px solid var(--border-card);
	}

	.status-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.status-note {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.status-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.btn-text {
		font-size: 0.8rem;
		color: var(--ink-muted);
		padding: 4px 10px;
		border-radius: 8px;
		background: rgba(31, 58, 95, 0.1);
		transition: all 0.2s;
	}

	.btn-text:hover {
		background: rgba(31, 58, 95, 0.2);
		color: var(--ink);
	}

	.btn-text-danger {
		font-size: 0.75rem;
		color: var(--danger);
		padding: 4px 8px;
		border-radius: 8px;
		background: rgba(239, 68, 68, 0.08);
	}

	.profile-layout {
		display: flex;
		align-items: flex-start;
		gap: 24px;
		flex-wrap: wrap;
	}

	.photo-container {
		width: 140px;
		height: 140px;
		flex-shrink: 0;
	}

	.photo-preview-box {
		width: 100%;
		height: 100%;
		border-radius: 18px;
		overflow: hidden;
		position: relative;
		border: 2px solid var(--primary-purple);
		box-shadow:none;
	}

	.photo-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.photo-overlay {
		position: absolute;
		inset: 0;
		background: var(--surface-inset);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.photo-preview-box:hover .photo-overlay {
		opacity: 1;
	}

	.overlay-btn {
		font-size: 0.75rem;
		color: #ffffff;
		background: rgba(31, 58, 95, 0.6);
		padding: 4px 12px;
		border-radius: 6px;
	}

	.overlay-btn.danger {
		background: rgba(239, 68, 68, 0.6);
	}

	.photo-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 18px;
		border: 2px dashed rgba(31, 58, 95, 0.4);
		background: rgba(31, 58, 95, 0.04);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 12px;
		text-align: center;
		color: var(--text-muted);
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.photo-placeholder:hover {
		border-color: var(--primary-purple);
		background: rgba(31, 58, 95, 0.08);
		color: var(--text-primary);
	}

	.placeholder-icon {
		color: var(--ink-muted);
		margin-bottom: 4px;
	}

	.placeholder-tag {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--ink-muted);
		margin-bottom: 4px;
	}

	.placeholder-help {
		font-size: 0.65rem;
		line-height: 1.2;
		opacity: 0.7;
	}

	.profile-details {
		flex: 1;
		min-width: 260px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.profile-name {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.profile-role {
		font-size: 0.9rem;
		color: var(--ink-muted);
		font-weight: 600;
		margin-top: -6px;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
		margin-top: 6px;
		padding: 14px;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 12px;
		border: 1px solid var(--border-card);
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.item-label {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-muted);
	}

	.item-value {
		font-size: 0.85rem;
		color: var(--text-primary);
		font-weight: 500;
	}

	.link-item {
		font-size: 0.85rem;
		color: var(--ink-muted);
		text-decoration: underline;
		word-break: break-all;
	}

	/* Formulario de edición */
	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.form-desc {
		font-size: 0.82rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field-group label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.field-group input {
		background: var(--surface-inset);
		border: 1px solid var(--border-card);
		border-radius: 10px;
		padding: 10px 14px;
		color: var(--text-primary);
		font-family: inherit;
		font-size: 0.9rem;
	}

	.field-group input:focus {
		border-color: var(--primary-purple);
		outline: none;
		box-shadow:none;
	}

	.form-buttons {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 10px;
	}

	.btn-cancel {
		padding: 10px 16px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-secondary);
		font-weight: 600;
		font-size: 0.85rem;
	}

	.btn-submit {
		padding: 10px 18px;
		border-radius: 10px;
		background: var(--primary-purple);
		color: #ffffff;
		font-weight: 600;
		font-size: 0.85rem;
		box-shadow:none;
	}

	.btn-submit:hover {
		opacity: 0.92;
	}
</style>
