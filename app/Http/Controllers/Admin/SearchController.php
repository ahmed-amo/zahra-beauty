<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json([
                'products' => [],
                'orders' => [],
                'customers' => [],
            ]);
        }

        $needle = '%'.mb_strtolower($q).'%';

        $products = Product::query()
            ->with('category:id,name')
            ->where(function ($query) use ($needle) {
                $query->whereRaw('LOWER(COALESCE(name, \'\')) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(COALESCE(slug, \'\')) LIKE ?', [$needle]);
            })
            ->orderBy('name')
            ->limit(6)
            ->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'category' => $p->category?->name,
                'image_url' => $p->galleryImageUrl(),
                'href' => '/admin/products/'.$p->id.'/edit',
            ]);

        $orders = Order::query()
            ->where(function ($query) use ($needle, $q) {
                $query->whereRaw('LOWER(COALESCE(order_number, \'\')) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(COALESCE(customer_name, \'\')) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(COALESCE(customer_email, \'\')) LIKE ?', [$needle]);
                if (ctype_digit($q)) {
                    $query->orWhere('id', (int) $q);
                }
            })
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Order $o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'customer_name' => $o->customer_name,
                'total' => (float) $o->total,
                'status' => $o->status,
                'href' => '/admin/customer-orders',
            ]);

        $customers = User::query()
            ->where('role', 'user')
            ->where(function ($query) use ($needle) {
                $query->whereRaw('LOWER(COALESCE(name, \'\')) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(COALESCE(email, \'\')) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(COALESCE(phone, \'\')) LIKE ?', [$needle]);
            })
            ->orderBy('name')
            ->limit(5)
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'href' => '/admin/customers/'.$u->id,
            ]);

        return response()->json([
            'products' => $products,
            'orders' => $orders,
            'customers' => $customers,
        ]);
    }
}
