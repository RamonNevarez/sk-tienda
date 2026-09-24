import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const emptyVariant = () => ({
  name: '',
  image_url: '',
  price: '',
  wholesale_price: '',
  wholesale_min_qty: 6,
  available: true,
})

function AdminPanel({ onClose, onSaved = () => {} }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('adminToken') || '')
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [form, setForm] = useState({ name: '', description: '', category_id: '', variants: [emptyVariant()] })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState([])
  const [adminProducts, setAdminProducts] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [uploadingVariant, setUploadingVariant] = useState(null)
  const [importing, setImporting] = useState(false)
  const [sourceUrl, setSourceUrl] = useState(() => localStorage.getItem('masterInventoryUrl') || '')
  const [syncPreview, setSyncPreview] = useState(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories`)
      .then((response) => response.json())
      .then(setCategoryOptions)
      .catch(() => setCategoryOptions([]))
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE_URL}/products/admin`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.msg || data.error || 'Sesión administrativa inválida')
        if (!Array.isArray(data)) throw new Error('Respuesta inválida del servidor')
        return data
      })
      .then(setAdminProducts)
      .catch((loadError) => {
        sessionStorage.removeItem('adminToken')
        setToken('')
        setError(loadError.message)
      })
  }, [token])

  const login = async (event) => {
    event.preventDefault()
    setError('')
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    const data = await response.json()
    if (!response.ok) {
      setError(data.error || 'No se pudo iniciar sesión')
      return
    }
    sessionStorage.setItem('adminToken', data.access_token)
    setToken(data.access_token)
  }

  const updateVariant = (index, field, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    }))
  }

  const uploadImage = async (index, file) => {
    if (!file || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setError('Configura Cloudinary antes de subir imágenes')
      return
    }

    setError('')
    setUploadingVariant(index)
    const payload = new FormData()
    payload.append('file', file)
    payload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    payload.append('folder', 'tienda/productos')

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: payload },
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'No se pudo subir la imagen')
      updateVariant(index, 'image_url', data.secure_url)
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setUploadingVariant(null)
    }
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    const response = await fetch(`${API_BASE_URL}${editingId ? `/products/${editingId}` : '/products'}`, {
      method: editingId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        category_id: Number(form.category_id),
        variants: form.variants.map((variant) => ({
          ...variant,
          price: Number(variant.price),
          wholesale_price: variant.wholesale_price === '' ? null : Number(variant.wholesale_price),
          wholesale_min_qty: Number(variant.wholesale_min_qty),
        })),
      }),
    })
    const data = await response.json()
    setSaving(false)
    if (!response.ok) {
      setError(data.error || 'No se pudo guardar el producto')
      return
    }
    setMessage(editingId ? 'Producto actualizado correctamente' : 'Producto creado correctamente')
    setForm({ name: '', description: '', category_id: '', variants: [emptyVariant()] })
    setEditingId(null)
    setFormOpen(false)
    const productsResponse = await fetch(`${API_BASE_URL}/products/admin`, { headers: { Authorization: `Bearer ${token}` } })
    setAdminProducts(await productsResponse.json())
    onSaved()
  }

  const editProduct = (product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id,
      variants: product.variants.map((variant) => ({
        name: variant.name,
        image_url: variant.image_url || '',
        price: variant.price,
        wholesale_price: variant.wholesale_price ?? '',
        wholesale_min_qty: variant.wholesale_min_qty || 6,
        available: variant.available,
      })),
    })
    setFormOpen(true)
  }

  const deleteProduct = async (product) => {
    if (!window.confirm(`¿Eliminar ${product.name}?`)) return
    const response = await fetch(`${API_BASE_URL}/products/${product.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      setError('No se pudo eliminar el producto')
      return
    }
    setAdminProducts((current) => current.filter((item) => item.id !== product.id))
    onSaved()
  }

  const importFile = async (file) => {
    if (!file) return
    setError('')
    setMessage('')
    setImporting(true)
    const payload = new FormData()
    payload.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/products/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error([data.error, ...(data.details || [])].filter(Boolean).join('. '))
      }
      setMessage(`${data.products_created} producto(s) importado(s) correctamente`)
      const productsResponse = await fetch(`${API_BASE_URL}/products/admin`, { headers: { Authorization: `Bearer ${token}` } })
      setAdminProducts(await productsResponse.json())
      onSaved()
    } catch (importError) {
      setError(importError.message)
    } finally {
      setImporting(false)
    }
  }

  const previewSync = async () => {
    setError('')
    setSyncing(true)
    try {
      const response = await fetch(`${API_BASE_URL}/products/sync/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: sourceUrl }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo consultar el enlace')
      setSyncPreview(data)
    } catch (syncError) {
      setError(syncError.message)
      setSyncPreview(null)
    } finally {
      setSyncing(false)
    }
  }

  const applySync = async () => {
    setError('')
    setSyncing(true)
    try {
      const response = await fetch(`${API_BASE_URL}/products/sync/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: sourceUrl }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo aplicar la sincronización')
      setMessage(`Sincronización aplicada: ${data.created} creados, ${data.updated} actualizados`)
      setSyncPreview(null)
      const productsResponse = await fetch(`${API_BASE_URL}/products/admin`, { headers: { Authorization: `Bearer ${token}` } })
      setAdminProducts(await productsResponse.json())
      onSaved()
    } catch (syncError) {
      setError(syncError.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 2 }}>
          <Typography variant="h4" component="h1">Dashboard administrativo</Typography>
          <Button variant="outlined" onClick={onClose}>Volver al catálogo</Button>
        </Box>
      </Box>
      {!token && <Typography color="text.secondary" sx={{ mb: 2 }}>Inicia sesión para administrar productos y variantes.</Typography>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        {!token ? (
          <Box component="form" onSubmit={login} sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField
              label="Usuario"
              value={credentials.username}
              onChange={(event) => setCredentials({ ...credentials, username: event.target.value })}
              required
            />
            <TextField
              label="Contraseña"
              type="password"
              value={credentials.password}
              onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
              required
            />
            <Button type="submit" variant="contained">Iniciar sesión</Button>
          </Box>
        ) : (
          <Box sx={{ pt: 1 }}>
            <Box sx={{ mb: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%' }}>
                <Button component="label" variant="outlined" disabled={importing} sx={{ flex: 1, minHeight: 46 }}>
                  {importing ? 'Importando...' : 'Importar CSV o Excel'}
                  <input
                    hidden
                    type="file"
                    accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(event) => importFile(event.target.files?.[0])}
                  />
                </Button>
                <Button
                  variant="contained"
                  sx={{ flex: 1, minHeight: 46 }}
                  onClick={() => {
                    setEditingId(null)
                    setForm({ name: '', description: '', category_id: '', variants: [emptyVariant()] })
                    setFormOpen(true)
                  }}
                >
                  Nuevo producto
                </Button>
              </Stack>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              Cada fila del archivo representa una variante. La imagen es opcional.
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Inventario maestro</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Usa un enlace de descarga CSV o XLSX. Los productos ausentes no se eliminan.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  label="Enlace del archivo o Google Sheets"
                  value={sourceUrl}
                  onChange={(event) => {
                    setSourceUrl(event.target.value)
                    localStorage.setItem('masterInventoryUrl', event.target.value)
                  }}
                />
                <Button variant="outlined" onClick={previewSync} disabled={!sourceUrl || syncing}>
                  {syncing ? 'Consultando...' : 'Consultar cambios'}
                </Button>
              </Stack>
              {syncPreview && (
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                    <Alert severity="info">Nuevos: {syncPreview.summary.new}</Alert>
                    <Alert severity="warning">Actualizados: {syncPreview.summary.updated}</Alert>
                    <Alert severity="success">Sin cambios: {syncPreview.summary.unchanged}</Alert>
                  </Stack>
                  <Paper variant="outlined" sx={{ overflowX: 'auto', mb: 2 }}>
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Tipo</TableCell><TableCell>Producto</TableCell><TableCell>Variante</TableCell><TableCell>Antes</TableCell><TableCell>Después</TableCell></TableRow></TableHead>
                      <TableBody>
                        {syncPreview.changes.map((change, index) => (
                          <TableRow key={`${change.product}-${change.variant}-${index}`}>
                            <TableCell>{change.type === 'new' ? 'Nuevo' : 'Actualizado'}</TableCell>
                            <TableCell>{change.product}</TableCell>
                            <TableCell>{change.variant}</TableCell>
                            <TableCell>{change.before}</TableCell>
                            <TableCell>{change.after}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                  <Button variant="contained" onClick={applySync} disabled={syncing || syncPreview.changes.length === 0}>
                    Aplicar cambios
                  </Button>
                </Box>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ overflowX: 'auto', mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Variantes</TableCell>
                    <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adminProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.variants.length}</TableCell>
                      <TableCell>{product.available ? 'Disponible' : 'Inactivo'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar producto">
                          <IconButton size="small" color="primary" onClick={() => editProduct(product)} aria-label={`Editar ${product.name}`}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar producto">
                          <IconButton size="small" color="error" onClick={() => deleteProduct(product)} aria-label={`Eliminar ${product.name}`}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            {formOpen && (
            <Box component="form" onSubmit={saveProduct} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField
                  fullWidth
                  label="Nombre del producto"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  fullWidth
                  select
                  label="Categoría"
                  value={form.category_id}
                  onChange={(event) => setForm({ ...form, category_id: event.target.value })}
                  required
                >
                  {categoryOptions.map((category) => (
                    <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Descripción"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>Variantes</Typography>

            {form.variants.map((variant, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1">Variante {index + 1}</Typography>
                  {form.variants.length > 1 && (
                    <IconButton onClick={() => setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) })} aria-label="Eliminar variante">
                      ×
                    </IconButton>
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Nombre de la variante" value={variant.name} onChange={(event) => updateVariant(index, 'name', event.target.value)} required />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack spacing={1}>
                      <TextField fullWidth label="URL de imagen (opcional)" value={variant.image_url} onChange={(event) => updateVariant(index, 'image_url', event.target.value)} />
                      <Button component="label" variant="outlined" disabled={uploadingVariant === index}>
                        {uploadingVariant === index ? 'Subiendo...' : 'Subir imagen'}
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          onChange={(event) => uploadImage(index, event.target.files?.[0])}
                        />
                      </Button>
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth type="number" label="Precio" value={variant.price} onChange={(event) => updateVariant(index, 'price', event.target.value)} required />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth type="number" label="Precio mayorista" value={variant.wholesale_price} onChange={(event) => updateVariant(index, 'wholesale_price', event.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth type="number" label="Mayoreo desde" value={variant.wholesale_min_qty} onChange={(event) => updateVariant(index, 'wholesale_min_qty', event.target.value)} />
                  </Grid>
                  <Grid size={12}>
                    <FormControlLabel
                      control={<Checkbox checked={variant.available} onChange={(event) => updateVariant(index, 'available', event.target.checked)} />}
                      label="Variante disponible"
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Button type="button" variant="outlined" onClick={() => setForm({ ...form, variants: [...form.variants, emptyVariant()] })} sx={{ mb: 2 }}>
              Agregar variante
            </Button>
            <Button type="submit" fullWidth variant="contained" disabled={saving}>
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </Box>
            )}
          </Box>
        )}
    </Container>
  )
}

export default AdminPanel
