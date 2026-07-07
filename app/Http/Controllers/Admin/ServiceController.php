<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Reference;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function index(): Response
    {
        $services = Service::query()
            ->with(['category:id,name', 'organization:id,short_name'])
            ->withCount('applications')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Service $s) => [
                'id' => $s->id,
                'slug' => $s->slug,
                'title' => $s->title,
                'status' => $s->status,
                'is_complex' => $s->is_complex,
                'steps_count' => is_array($s->schema['steps'] ?? null) ? count($s->schema['steps']) : 0,
                'applications_count' => $s->applications_count,
                'category' => $s->category?->name,
                'organization' => $s->organization?->short_name,
                'updated_at' => $s->updated_at?->toDateString(),
            ]);

        return Inertia::render('admin/services/index', [
            'services' => $services,
            'stats' => [
                'total' => $services->count(),
                'published' => $services->where('status', 'published')->count(),
                'draft' => $services->where('status', 'draft')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/services/builder', [
            'service' => null,
            'options' => $this->builderOptions(),
        ]);
    }

    public function edit(Service $service): Response
    {
        return Inertia::render('admin/services/builder', [
            'service' => [
                'id' => $service->id,
                'slug' => $service->slug,
                'title' => $service->title,
                'summary' => $service->summary,
                'description' => $service->description,
                'service_category_id' => $service->service_category_id,
                'organization_id' => $service->organization_id,
                'is_popular' => $service->is_popular,
                'is_complex' => $service->is_complex,
                'status' => $service->status,
                'meta' => $service->meta ?? [],
                'schema' => $service->schema ?? ['steps' => [], 'settings' => []],
            ],
            'options' => $this->builderOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['title']);
        $data['published_at'] = $data['status'] === 'published' ? Carbon::now() : null;

        $service = Service::create($data);

        return redirect()->route('admin.services.edit', $service)
            ->with('success', 'Услуга создана.');
    }

    public function update(Request $request, Service $service): RedirectResponse
    {
        $data = $this->validated($request);

        if ($data['status'] === 'published' && $service->status !== 'published') {
            $data['published_at'] = Carbon::now();
        }

        $service->update($data);

        return back()->with('success', 'Изменения сохранены.');
    }

    public function destroy(Service $service): RedirectResponse
    {
        $service->delete();

        return redirect()->route('admin.services.index')->with('success', 'Услуга удалена.');
    }

    /**
     * AI-генерация черновика схемы услуги по текстовому описанию.
     */
    public function aiGenerate(Request $request, AiService $ai): JsonResponse
    {
        $validated = $request->validate([
            'description' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        return response()->json($ai->generateServiceSchema($validated['description']));
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'summary' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'service_category_id' => ['nullable', 'exists:service_categories,id'],
            'organization_id' => ['nullable', 'exists:organizations,id'],
            'is_popular' => ['boolean'],
            'is_complex' => ['boolean'],
            'status' => ['required', 'in:draft,published'],
            'meta' => ['nullable', 'array'],
            'schema' => ['required', 'array'],
            'schema.steps' => ['present', 'array'],
        ]);

        // Сложность услуги выводим из числа этапов, если админ не задал вручную.
        $validated['is_complex'] = $request->boolean('is_complex')
            || count($validated['schema']['steps'] ?? []) > 1;

        return $validated;
    }

    /**
     * Справочные данные для конструктора: категории, организации, типы справочников.
     *
     * @return array<string, mixed>
     */
    private function builderOptions(): array
    {
        $referenceLabels = [
            'regions' => 'Регионы',
            'industries' => 'Отрасли',
            'applicant_types' => 'Типы заявителя',
        ];

        $referenceTypes = Reference::query()
            ->select('type')
            ->distinct()
            ->pluck('type')
            ->map(fn ($type) => ['value' => $type, 'label' => $referenceLabels[$type] ?? $type])
            ->values();

        return [
            'categories' => ServiceCategory::orderBy('sort')->get(['id', 'name'])->all(),
            'organizations' => Organization::orderBy('name')->get(['id', 'name', 'short_name'])->all(),
            'referenceTypes' => $referenceTypes,
        ];
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title);
        if ($base === '') {
            $base = 'usluga-'.Str::lower(Str::random(6));
        }

        $slug = $base;
        $i = 2;
        while (Service::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
