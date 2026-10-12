<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Payment methods
    |--------------------------------------------------------------------------
    |
    | Checkout currently forces cash on delivery server-side (no payment step).
    | Chargily Pay stays disabled until its integration actually exists
    | (hosted checkout redirect, webhook, payment_status updates) — the option
    | card and translations remain in the codebase for later; set
    | CHARGILY_ENABLED=true once that work lands and re-enable the UI.
    |
    */

    'methods' => [
        'cash' => true,
        'chargily' => (bool) env('CHARGILY_ENABLED', false),
    ],

];
