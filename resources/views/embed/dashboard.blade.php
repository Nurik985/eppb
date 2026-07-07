<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>
    <style>
        :root {
            --brand: #0d8f81; --ink: #0f2422; --muted: #5a6d6b; --line: #e2e9e8;
            --ground: #f6f9f8; --surface: #fff;
        }
        @media (prefers-color-scheme: dark) {
            :root { --brand: #2fd3bd; --ink: #e9f4f2; --muted: #90a7a4; --line: #1e332f;
                --ground: #0a1413; --surface: #10201e; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            background: var(--ground); color: var(--ink); padding: 20px; }
        .head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        h1 { font-size: 1.15rem; margin: 0; letter-spacing: -.01em; }
        .src { color: var(--muted); font-size: .78rem; }
        .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0; }
        .kpi { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; }
        .kpi .v { font-size: 1.5rem; font-weight: 800; color: var(--brand); letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
        .kpi .l { color: var(--muted); font-size: .78rem; margin-top: 3px; }
        .chart { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 16px; }
        .chart h2 { font-size: .85rem; color: var(--muted); font-weight: 600; margin: 0 0 12px; text-transform: uppercase; letter-spacing: .06em; }
        .bars { display: grid; grid-template-columns: repeat({{ count($series) }}, 1fr); gap: 10px; align-items: end; height: 180px; }
        .bar { display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
        .bar .col { width: 60%; max-width: 46px; background: linear-gradient(var(--brand), color-mix(in oklab, var(--brand) 55%, transparent)); border-radius: 7px 7px 0 0; }
        .bar .n { font-size: .72rem; color: var(--muted); }
        .bar .val { font-size: .72rem; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; }
    </style>
</head>
<body>
    <div class="head">
        <h1>{{ $title }}</h1>
        <span class="src">Источник: {{ $source }}</span>
    </div>

    <div class="kpis">
        @foreach ($kpis as $kpi)
            <div class="kpi"><div class="v">{{ $kpi['value'] }}</div><div class="l">{{ $kpi['label'] }}</div></div>
        @endforeach
    </div>

    <div class="chart">
        <h2>{{ $chartTitle }}</h2>
        @php $max = max(array_column($series, 'value')) ?: 1; @endphp
        <div class="bars">
            @foreach ($series as $point)
                <div class="bar">
                    <span class="val">{{ $point['value'] }}</span>
                    <div class="col" style="height: {{ max(6, round($point['value'] / $max * 150)) }}px"></div>
                    <span class="n">{{ $point['name'] }}</span>
                </div>
            @endforeach
        </div>
    </div>
</body>
</html>
