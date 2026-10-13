package com.example.inventory.rest;

import java.util.List;

import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import com.example.inventory.entity.Product;
import com.example.inventory.service.ProductServiceLocal;

/**
 * REST endpoints for product/inventory management, consumed by the
 * AngularJS frontend's Product module.
 */
@Stateless
@Path("/products")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProductResource {

    @EJB
    private ProductServiceLocal productService;

    @GET
    public List<Product> listProducts() {
        return productService.findAll();
    }

    @GET
    @Path("/{id}")
    public Response getProduct(@PathParam("id") Long id) {
        Product product = productService.findById(id);
        if (product == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(product).build();
    }

    @GET
    @Path("/low-stock")
    public List<Product> listLowStock() {
        return productService.findLowStock();
    }

    @POST
    public Response createProduct(Product product) {
        Product created = productService.createProduct(product);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateProduct(@PathParam("id") Long id, Product product) {
        Product updated = productService.updateProduct(id, product);
        if (updated == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(updated).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deleteProduct(@PathParam("id") Long id) {
        productService.deleteProduct(id);
        return Response.noContent().build();
    }
}
