<?php

namespace App\Http\Controllers;

use App\Services\AiService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssistantController extends Controller
{
    public function index(AiService $ai): Response
    {
        return Inertia::render('assistant', [
            'aiEnabled' => $ai->enabled(),
            'situation' => '',
            'result' => null,
        ]);
    }

    public function suggest(Request $request, AiService $ai): Response
    {
        $validated = $request->validate([
            'situation' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        return Inertia::render('assistant', [
            'aiEnabled' => $ai->enabled(),
            'situation' => $validated['situation'],
            'result' => $ai->suggestServices($validated['situation']),
        ]);
    }
}
