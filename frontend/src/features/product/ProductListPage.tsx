import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ProductService } from '../../services/product.service';
import { statusOf } from '../../api/http';
import type { Product } from '../../api/types';
import { currency } from '../../shared/filters';
import { ErrorBanner, LoadingIndicator } from '../../shared/Feedback';

/** React port of `ProductListController` + `product-list.html`. */
export function ProductListPage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await ProductService.getAll()).data,
  });

  const removeProduct = useMutation({
    mutationFn: (product: Product) => ProductService.remove(product.id),
    onSuccess: (_response, product) => {
      queryClient.setQueryData<Product[]>(['products'], (current) =>
        (current ?? []).filter((p) => p.id !== product.id)
      );
    },
  });

  const loading = query.isPending;
  const products = query.data ?? [];
  const error = query.isError ? `Failed to load products (status ${statusOf(query.error)})` : null;

  function deleteProduct(product: Product): void {
    if (!window.confirm(`Delete product ${product.sku}?`)) {
      return;
    }
    removeProduct.mutate(product);
  }

  return (
    <>
      <h2>Products</h2>

      <Link className="btn btn-primary" to="/products/new">
        Add Product
      </Link>

      {loading && <LoadingIndicator noun="products" />}
      <ErrorBanner message={error} />

      {!loading && (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Unit Price</th>
              <th>Quantity On Hand</th>
              <th>Reorder Threshold</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className={product.lowStock ? 'danger' : undefined}>
                <td>{product.sku}</td>
                <td>
                  <Link to={`/products/${product.id}`}>{product.name}</Link>
                </td>
                <td>{currency(product.unitPrice)}</td>
                <td>{product.quantityOnHand}</td>
                <td>{product.reorderThreshold}</td>
                <td>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteProduct(product)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
