import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Divider,
  Drawer,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Stack,
  Snackbar,
  Toolbar,
  Typography,
  TextField,
} from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import AdminPanel from './AdminPanel.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const PRODUCT_PLACEHOLDER = '/placeholder-product.svg'

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)

const getUnitPrice = (item) => {
  if (item.quantity >= item.wholesaleMinQty) {
    return item.wholesalePrice ?? item.price
  }

  return item.price
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState(['Todos'])
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [variantQuantities, setVariantQuantities] = useState({})
  const [loading, setLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [addedMessage, setAddedMessage] = useState('')
  const [cart, setCart] = useState([])

  useEffect(() => {
    if (location.pathname !== '/') return

    const loadCatalog = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/products`),
          fetch(`${API_BASE_URL}/categories`),
        ])

        if (!productsResponse.ok || !categoriesResponse.ok) {
          throw new Error('No se pudo cargar el catálogo')
        }

        const [apiProducts, apiCategories] = await Promise.all([
          productsResponse.json(),
          categoriesResponse.json(),
        ])
        const categoryNames = Object.fromEntries(apiCategories.map((category) => [category.id, category.name]))
        const normalizedProducts = apiProducts.map((product) => ({
          ...product,
          category: categoryNames[product.category_id] || 'Sin categoría',
          wholesalePrice: product.wholesale_price,
          wholesaleMinQty: product.wholesale_min_qty || 6,
          image: product.image_url || PRODUCT_PLACEHOLDER,
          variants: product.variants.map((variant) => ({
            ...variant,
            image: variant.image_url || product.image_url || PRODUCT_PLACEHOLDER,
            wholesalePrice: variant.wholesale_price,
            wholesaleMinQty: variant.wholesale_min_qty || 6,
          })),
        }))

        setProducts(normalizedProducts)
        setCategories(['Todos', ...apiCategories.map((category) => category.name)])
        setCatalogError('')
      } catch {
        setCatalogError('No se pudo conectar con el catálogo. Mostrando datos de ejemplo.')
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
  }, [location.pathname])

  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase()
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory
      const searchableText = [
        product.name,
        product.category,
        ...product.variants.map((variant) => variant.name),
      ].join(' ').toLocaleLowerCase()
      return matchesCategory && (!normalizedSearch || searchableText.includes(normalizedSearch))
    })
  }, [products, searchTerm, selectedCategory])

  const addToCart = (product, variant, quantity = 1) => {
    if (!product.available || !variant.available || quantity <= 0) return

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.variantId === variant.id,
      )

      if (existingItem) {
        return currentCart.map((item) =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }

      return [
        ...currentCart,
        {
          id: product.id,
          variantId: variant.id,
          name: product.name,
          variantName: variant.name,
          price: variant.price,
          wholesalePrice: variant.wholesalePrice,
          wholesaleMinQty: variant.wholesaleMinQty,
          quantity,
        },
      ]
    })

    setAddedMessage(`${product.name} - ${variant.name} se agregó al carrito`)
  }

  const openProductVariants = (product) => {
    setSelectedProduct(product)
    setVariantQuantities(Object.fromEntries(
      product.variants.map((variant) => [variant.id, variant.available ? 1 : 0]),
    ))
  }

  const updateVariantQuantity = (variantId, delta) => {
    setVariantQuantities((current) => ({
      ...current,
      [variantId]: Math.max(0, (current[variantId] || 0) + delta),
    }))
  }

  const addSelectedVariants = () => {
    if (!selectedProduct) return
    const selected = selectedProduct.variants.filter((variant) => (variantQuantities[variant.id] || 0) > 0)
    selected.forEach((variant) => addToCart(selectedProduct, variant, variantQuantities[variant.id]))
    if (selected.length > 0) {
      const totalUnits = selected.reduce((sum, variant) => sum + variantQuantities[variant.id], 0)
      setAddedMessage(`${totalUnits} artículo(s) de ${selectedProduct.name} se agregaron al carrito`)
      setSelectedProduct(null)
    }
  }

  const updateQuantity = (variantId, delta) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.variantId === variantId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const total = cart.reduce((sum, item) => sum + getUnitPrice(item) * item.quantity, 0)

  const createWhatsAppMessage = () => {
    const lines = cart.map(
      (item) => `• ${item.quantity} × ${item.name} - ${item.variantName} — ${formatCurrency(getUnitPrice(item) * item.quantity)}`,
    )
    const message = `Hola, quiero realizar el siguiente pedido:\n\n${lines.join('\n')}\n\nTotal: ${formatCurrency(total)}`
    const whatsappNumber = '526678435976'
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (location.pathname === '/admin') {
    return (
      <AdminPanel
        onClose={() => navigate('/')}
      />
    )
  }

  return (
    <>
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="SK Bolsos Personalizados"
              sx={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="secondary"
              onClick={() => setCartOpen(true)}
              sx={{
                backgroundColor: 'rgba(216, 168, 78, 0.16)',
                borderRadius: 2,
                width: 48,
                height: 48,
                position: 'relative',
              }}
              aria-label="Abrir carrito"
            >
              <Badge
                badgeContent={cart.reduce((sum, item) => sum + item.quantity, 0)}
                color="error"
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            SK Bolsos Personalizados
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Bolsos, carteras y accesorios personalizados.
          </Typography>
        </Box>

          {loading && <Alert severity="info" sx={{ mb: 3 }}>Cargando catálogo...</Alert>}
          {catalogError && <Alert severity="warning" sx={{ mb: 3 }}>{catalogError}</Alert>}

        <Stack direction="row" spacing={1} sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              color={selectedCategory === category ? 'primary' : 'default'}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
              clickable
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </Stack>

        <TextField
          fullWidth
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar productos o variantes"
          aria-label="Buscar productos o variantes"
          sx={{ mb: 4 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchTerm('')} aria-label="Limpiar búsqueda" edge="end">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Grid container spacing={3}>
          {visibleProducts.map((product) => {
            const primaryVariant = product.variants[0]

            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia component="img" height="220" image={primaryVariant?.image || product.image || PRODUCT_PLACEHOLDER} alt={product.name} />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" component="h2">
                        {product.name}
                      </Typography>
                      {product.available ? (
                        <Chip label="Disponible" color="success" size="small" />
                      ) : (
                        <Chip label="Sin stock" color="error" size="small" />
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {product.description}
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Desde {formatCurrency(primaryVariant?.price || product.price)}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {product.variants.length} variantes disponibles
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {product.category}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => openProductVariants(product)}
                      disabled={!product.variants.some((variant) => variant.available)}
                    >
                      Ver variantes
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )
          })}
        </Grid>
        {!loading && !catalogError && products.length === 0 && (
          <Alert severity="info" sx={{ mt: 3 }}>
            Todavía no hay productos publicados.
          </Alert>
        )}
        {!loading && products.length > 0 && visibleProducts.length === 0 && (
          <Alert severity="info" sx={{ mt: 3 }}>
            No encontramos productos con esos criterios.
          </Alert>
        )}
      </Container>

      <Dialog open={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} fullWidth maxWidth="md">
        <DialogTitle>{selectedProduct?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona una variante para agregarla al carrito.
          </Typography>
          <Grid container spacing={2}>
            {selectedProduct?.variants.map((variant) => (
              <Grid size={{ xs: 12, sm: 6 }} key={variant.id}>
                <Card variant="outlined">
                  <CardMedia component="img" height="170" image={variant.image || PRODUCT_PLACEHOLDER} alt={variant.name} />
                  <CardContent>
                    <Typography variant="h6">{variant.name}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {formatCurrency(variant.price)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                      Mayoreo desde {variant.wholesaleMinQty} unidades: {formatCurrency(variant.wholesalePrice)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={() => updateVariantQuantity(variant.id, -1)}
                        disabled={!variant.available || !(variantQuantities[variant.id] > 0)}
                        aria-label={`Restar ${variant.name}`}
                      >
                        −
                      </Button>
                      <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>
                        {variantQuantities[variant.id] || (variant.available ? 1 : 0)}
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => updateVariantQuantity(variant.id, 1)}
                        disabled={!variant.available}
                        aria-label={`Sumar ${variant.name}`}
                      >
                        +
                      </Button>
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 1.5 }}
                      onClick={() => {
                        const quantity = variantQuantities[variant.id] || 1
                        addToCart(selectedProduct, variant, quantity)
                        setVariantQuantities((current) => ({ ...current, [variant.id]: 1 }))
                      }}
                      disabled={!variant.available}
                    >
                      Agregar al carrito
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={addSelectedVariants}
            disabled={!Object.values(variantQuantities).some((quantity) => quantity > 0)}
          >
            Agregar seleccionados
          </Button>
        </DialogContent>
      </Dialog>

      <Drawer anchor="right" open={cartOpen} onClose={() => setCartOpen(false)}>
        <Box sx={{ width: 380, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Carrito
            </Typography>
            <IconButton onClick={() => setCartOpen(false)} aria-label="Cerrar carrito">
              ✕
            </IconButton>
          </Box>

          {cart.length === 0 ? (
            <Typography color="text.secondary">Tu carrito está vacío.</Typography>
          ) : (
            <List disablePadding>
              {cart.map((item) => {
                const itemTotal = getUnitPrice(item) * item.quantity

                return (
                  <ListItem key={`${item.id}-${item.variantId}`} disableGutters sx={{ display: 'block', mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ListItemText
                        primary={`${item.name} - ${item.variantName}`}
                        secondary={
                          item.quantity >= item.wholesaleMinQty
                            ? `Precio mayoreo: ${formatCurrency(getUnitPrice(item))}`
                            : `Precio: ${formatCurrency(getUnitPrice(item))}`
                        }
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton onClick={() => updateQuantity(item.variantId, -1)} aria-label="restar cantidad">
                          −
                        </IconButton>
                        <Typography>{item.quantity}</Typography>
                        <IconButton onClick={() => updateQuantity(item.variantId, 1)} aria-label="sumar cantidad">
                          +
                        </IconButton>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatCurrency(itemTotal)}
                      </Typography>
                    </Box>
                  </ListItem>
                )
              })}
            </List>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {formatCurrency(total)}
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            color="success"
            onClick={createWhatsAppMessage}
            disabled={cart.length === 0}
          >
            Pedir por WhatsApp
          </Button>
        </Box>
      </Drawer>

      <Snackbar
        open={Boolean(addedMessage)}
        autoHideDuration={2400}
        onClose={() => setAddedMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setAddedMessage('')} severity="success" variant="filled" sx={{ width: '100%' }}>
          {addedMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default App
