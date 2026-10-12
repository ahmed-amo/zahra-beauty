<?php

namespace App\Http\Controllers;

use App\Support\AlgeriaLocations;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlgeriaLocationController extends Controller
{
    public function wilayas(AlgeriaLocations $locations): JsonResponse
    {
        return response()->json([
            'wilayas' => $locations->wilayas(),
        ]);
    }

    public function communes(string $wilayaCode, AlgeriaLocations $locations): JsonResponse
    {
        $code = str_pad($wilayaCode, 2, '0', STR_PAD_LEFT);

        return response()->json([
            'wilaya_code' => $code,
            'communes' => $locations->communesForWilaya($code),
        ]);
    }
}
