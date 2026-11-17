/* ACQI preview shell.
   Read-only rendering of one fictional deal. The only interactions are
   sidebar navigation, tab switching, table sorting and row detail. Nothing
   here saves, submits or executes. */

(function () {
  'use strict';

  var node = document.getElementById('acqi-data');
  var DATA = JSON.parse(node.textContent);
  var root = document.getElementById('content');
  var crumb = document.getElementById('crumb-current');
  var side = document.getElementById('side');

  var STATE_HELP = {
    collected: 'Read from the source shown, at the time recorded. Nothing was inferred.',
    partial: 'Part of the scope was read. The rest is listed as not collected rather than assumed.',
    conflicted: 'Two sources disagree. The record is held open until a named owner decides.',
    unreadable: 'The source refused or returned nothing. No values were obtained and none were invented.',
    'not-collected': 'Outside the phase one scope. No value exists for this record.'
  };

  var STATE_LABEL = {
    collected: 'Collected',
    partial: 'Partial',
    conflicted: 'Conflicted',
    unreadable: 'Unreadable',
    'not-collected': 'Not collected'
  };

  var NAV = [
    {
      group: 'Start here',
      items: [
        { id: 'overview', label: 'Overview', glyph: 'grid' },
        { id: 'deal', label: 'Deal', glyph: 'box' },
        { id: 'setup', label: 'Setup', glyph: 'gear' },
        { id: 'admin', label: 'Administration', glyph: 'shield' },
        { id: 'settings', label: 'Settings', glyph: 'gear' }
      ]
    },
    {
      group: '1 · Discover',
      items: [
        { id: 'discovery', label: 'Discovery Hub', glyph: 'radar' },
        { id: 'discovered', label: 'Discovered Hub', glyph: 'grid' }
      ]
    },
    {
      group: '2 · Consolidate',
      items: [
        { id: 'inventory', label: 'Consolidated Enterprise Views', glyph: 'grid' },
        { id: 'organisation', label: 'Organisation Map', glyph: 'flow' }
      ]
    },
    {
      group: '3 · Assess',
      items: [
        { id: 'governance', label: 'M&A Governance', glyph: 'shield' },
        { id: 'analytics', label: 'Analytics', glyph: 'flow' },
        { id: 'security', label: 'Security', glyph: 'shield' },
        { id: 'compliance', label: 'Compliance', glyph: 'shield' }
      ]
    },
    {
      group: '4 · Plan & Migrate',
      items: [
        { id: 'migration', label: 'Migration', glyph: 'flow' },
        { id: 'cloudfit', label: 'Cloud Fit', glyph: 'box' },
        { id: 'licensing', label: 'Licensing Hub', glyph: 'box' }
      ]
    },
    {
      group: '5 · Operate & Close',
      items: [
        { id: 'operations', label: 'Operations', glyph: 'flow' },
        { id: 'reports', label: 'Reports', glyph: 'book' }
      ]
    },
    {
      group: 'Assistant & platform',
      items: [
        { id: 'aria', label: 'Aria Assist', glyph: 'chat' },
        { id: 'help', label: 'Help & Intelligence', glyph: 'book' }
      ]
    },
    {
      group: 'More',
      items: [
        { id: 'infrastructure', label: 'Infrastructure', glyph: 'box' },
        { id: 'assets', label: 'Assets', glyph: 'box' },
        { id: 'integration', label: 'Integration', glyph: 'flow' },
        { id: 'advanced', label: 'Advanced', glyph: 'gear' }
      ]
    }
  ];

  function esc(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function glyph(kind) {
    var paths = {
      grid: '<rect x="1.5" y="1.5" width="4" height="4"/><rect x="6.5" y="1.5" width="4" height="4"/><rect x="1.5" y="6.5" width="4" height="4"/><rect x="6.5" y="6.5" width="4" height="4"/>',
      box: '<rect x="2" y="2" width="8" height="8"/><path d="M2 5h8"/>',
      gear: '<circle cx="6" cy="6" r="2.1"/><path d="M6 .8v1.6M6 9.6v1.6M.8 6h1.6M9.6 6h1.6M2.3 2.3l1.1 1.1M8.6 8.6l1.1 1.1M9.7 2.3L8.6 3.4M3.4 8.6L2.3 9.7"/>',
      shield: '<path d="M6 1 10.5 2.6v4.1C10.5 9.2 8.6 10.6 6 11.2 3.4 10.6 1.5 9.2 1.5 6.7V2.6Z"/>',
      flow: '<circle cx="2.4" cy="3" r="1.4"/><circle cx="9.6" cy="3" r="1.4"/><circle cx="6" cy="9" r="1.4"/><path d="M3.8 3h4.4M3.1 4.2 5.4 7.8M8.9 4.2 6.6 7.8"/>',
      book: '<path d="M2 1.8h8v8.4H2z"/><path d="M4 1.8v8.4"/>',
      chat: '<path d="M1.8 2h8.4v6H6l-2.6 2v-2H1.8z"/>',
      radar: '<circle cx="6" cy="6" r="4.6"/><circle cx="6" cy="6" r="2.2"/><path d="M6 6 9.4 2.6"/>'
    };
    return '<svg class="side__glyph" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">' + (paths[kind] || paths.box) + '</svg>';
  }

  /* ---------- shared renderers ------------------------------------------ */

  function stateChip(state) {
    var key = String(state || 'not-collected');
    return '<span class="state state--' + esc(key) + '">' + esc(STATE_LABEL[key] || key) + '</span>';
  }

  function kpis(items) {
    return (
      '<div class="kpis">' +
      items
        .map(function (k) {
          return (
            '<div class="kpi"><p class="kpi__label">' +
            esc(k.label) +
            '</p><p class="kpi__value">' +
            esc(k.value) +
            '</p><p class="kpi__note">' +
            esc(k.note || '') +
            '</p></div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function legend() {
    return (
      '<div class="legend">' +
      '<p><strong>Data states</strong></p>' +
      ['collected', 'partial', 'conflicted', 'unreadable', 'not-collected']
        .map(function (s) {
          return '<p>' + stateChip(s) + '</p>';
        })
        .join('') +
      '</div>'
    );
  }

  function notice(html) {
    return '<div class="notice">' + html + '</div>';
  }

  function leaders(items) {
    return (
      '<ul class="leaders">' +
      items
        .map(function (i) {
          return (
            '<li><span>' +
            esc(i.label) +
            '</span><span class="lead-dots"></span><span class="lead-meta">' +
            esc(i.meta || '') +
            '</span></li>'
          );
        })
        .join('') +
      '</ul>'
    );
  }

  function defs(pairs) {
    return (
      '<dl class="defs">' +
      pairs
        .map(function (p) {
          return '<div><dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd></div>';
        })
        .join('') +
      '</dl>'
    );
  }

  function bars(items, red) {
    var max = 0;
    items.forEach(function (i) {
      if (i.value > max) max = i.value;
    });
    return (
      '<ul class="bars">' +
      items
        .map(function (i) {
          var pct = max ? Math.round((i.value / max) * 100) : 0;
          return (
            '<li><div class="bars__row"><span>' +
            esc(i.label) +
            '</span><span class="mono">' +
            esc(String(i.value)) +
            '</span></div><div class="bars__track"><div class="bars__fill' +
            (red ? ' bars__fill--red' : '') +
            '" style="width:' +
            pct +
            '%"></div></div></li>'
          );
        })
        .join('') +
      '</ul>'
    );
  }

  var TABLE_CACHE = {};

  function table(spec) {
    var sort = sortState[spec.id] || { key: null, dir: null };
    var rows = spec.rows.slice();
    if (sort.key) {
      var col = null;
      spec.columns.forEach(function (c) {
        if (c.key === sort.key) col = c;
      });
      rows.sort(function (a, b) {
        var av = a[sort.key];
        var bv = b[sort.key];
        if (col && col.numeric) {
          av = Number(av) || 0;
          bv = Number(bv) || 0;
          return sort.dir === 'asc' ? av - bv : bv - av;
        }
        av = String(av === undefined ? '' : av).toLowerCase();
        bv = String(bv === undefined ? '' : bv).toLowerCase();
        if (av < bv) return sort.dir === 'asc' ? -1 : 1;
        if (av > bv) return sort.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    TABLE_CACHE[spec.id] = rows;

    var head = spec.columns
      .map(function (c) {
        var aria =
          sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
        return (
          '<th scope="col" aria-sort="' +
          aria +
          '"><button type="button" data-sort="' +
          esc(spec.id) +
          '" data-key="' +
          esc(c.key) +
          '">' +
          esc(c.label) +
          '</button></th>'
        );
      })
      .join('');

    var body = rows
      .map(function (row, index) {
        var cells = spec.columns
          .map(function (c, ci) {
            var value = row[c.key];
            if (c.key === 'state' && ci > 0) {
              return '<td>' + stateChip(value) + '</td>';
            }
            if (ci === 0) {
              return '<th scope="row">' + esc(value) + '</th>';
            }
            return '<td class="' + (c.numeric ? 'num' : '') + '">' + esc(value) + '</td>';
          })
          .join('');
        return (
          '<tr tabindex="0" data-table="' +
          esc(spec.id) +
          '" data-index="' +
          index +
          '" data-title="' +
          esc(row[spec.columns[0].key]) +
          '">' +
          cells +
          '</tr>'
        );
      })
      .join('');

    return (
      '<div class="tablewrap"><table class="data"><caption>' +
      esc(spec.caption) +
      '</caption><thead><tr>' +
      head +
      '</tr></thead><tbody>' +
      body +
      '</tbody></table></div>'
    );
  }

  var sortState = {};

  /* ---------- screens --------------------------------------------------- */

  var SCREENS = {};

  SCREENS.overview = {
    title: 'Overview',
    sub: 'Deal state, open conflicts and the health of the collectors feeding the record.',
    render: function () {
      var open = DATA.conflicts.filter(function (c) {
        return c.state === 'open';
      });
      var bad = DATA.sources.filter(function (s) {
        return s.state === 'unreadable' || s.state === 'not-collected' || s.state === 'partial';
      });
      return (
        notice(
          '<strong>' +
            esc(DATA.meta.banner) +
            '</strong> ' +
            esc(DATA.meta.note)
        ) +
        kpis(DATA.kpis) +
        legend() +
        '<div class="panels">' +
        '<div class="panel"><h2>Needs an owner</h2>' +
        leaders(
          open.map(function (c) {
            return { label: c.topic, meta: c.owner };
          })
        ) +
        '</div>' +
        '<div class="panel"><h2>Collectors not clean</h2>' +
        leaders(
          bad.map(function (s) {
            return { label: s.name, meta: STATE_LABEL[s.state] };
          })
        ) +
        '</div>' +
        '<div class="panel"><h2>Deal</h2>' +
        defs([
          ['Acquirer', DATA.deal.acquirer],
          ['Target', DATA.deal.target],
          ['Stage', DATA.deal.stage]
        ]) +
        '</div></div>'
      );
    },
    after: function () {}
  };

  SCREENS.deal = {
    title: 'Deal',
    sub: 'The acquisition record this record set belongs to.',
    render: function () {
      return (
        notice('One fictional deal is loaded. No other deal exists in this preview.') +
        defs([
          ['Acquirer', DATA.deal.acquirer],
          ['Target', DATA.deal.target],
          ['Sector', DATA.deal.sector],
          ['Announced', DATA.deal.announced],
          ['Stage', DATA.deal.stage],
          ['Enterprise value', DATA.deal.enterpriseValue]
        ]) +
        '<div class="panels">' +
        '<div class="panel"><h2>Milestones</h2><ul class="timeline">' +
        DATA.deal.milestones
          .map(function (m) {
            return (
              '<li><span class="t-date">' +
              esc(m.date) +
              '</span><span>' +
              esc(m.label) +
              '</span><span class="state state--' +
              (m.state === 'done' ? 'collected' : m.state === 'active' ? 'partial' : 'not-collected') +
              '">' +
              esc(m.state) +
              '</span></li>'
            );
          })
          .join('') +
        '</ul></div>' +
        '<div class="panel"><h2>Deal team</h2>' +
        table({
          id: 'dealteam',
          caption: 'Role assignments',
          columns: [
            { key: 'name', label: 'Name' },
            { key: 'role', label: 'Role' },
            { key: 'side', label: 'Side' }
          ],
          rows: DATA.deal.dealTeam
        }) +
        '</div></div>'
      );
    },
    after: function () {}
  };

  SCREENS.discovery = {
    title: 'Discovery Hub',
    sub: 'Collector runs, credentials and the state of each source.',
    render: function () {
      return (
        notice(
          '<strong>Every credential here is read-only and time-boxed.</strong> The run that produced this record used five delegated credentials, each scoped to one workload and expiring within ninety days.'
        ) +
        table({
          id: 'sources',
          caption: 'Sources, last run and credential',
          columns: [
            { key: 'name', label: 'Source' },
            { key: 'objects', label: 'Objects', numeric: true },
            { key: 'lastRun', label: 'Last run' },
            { key: 'credential', label: 'Credential' },
            { key: 'state', label: 'State' }
          ],
          rows: DATA.sources
        }) +
        '<p style="margin-top:1rem"><button class="btn" type="button" disabled title="Collection is disabled in the preview. Nothing runs here.">Run discovery</button></p>' +
        '<p class="mono" style="color:var(--ink-faint);margin-top:.4rem">Disabled in preview: no collector executes and no credential is used.</p>'
      );
    }
  };

  SCREENS.discovered = {
    title: 'Discovered Hub',
    sub: 'Every entity type the collectors returned, with the state of each population.',
    render: function () {
      var summary = [
        { name: 'People and identities', objects: DATA.people.length, source: 'Entra ID, Active Directory', state: 'collected' },
        { name: 'Applications', objects: DATA.apps.length, source: 'Azure, Active Directory, endpoint', state: 'partial' },
        { name: 'Workspaces', objects: DATA.workspaces.length, source: 'Microsoft 365', state: 'partial' },
        { name: 'Sites and facilities', objects: DATA.sites.length, source: 'Active Directory, endpoint', state: 'partial' },
        { name: 'Devices', objects: 0, source: 'VMware vCenter', state: 'unreadable' },
        { name: 'Cloud resources (AWS)', objects: 0, source: 'AWS accounts', state: 'not-collected' }
      ];
      return (
        notice('The counts below are the number of sample rows in this preview, not an estate total. In a real installation they are the number of objects read.') +
        table({
          id: 'discovered',
          caption: 'Entity populations',
          columns: [
            { key: 'name', label: 'Entity type' },
            { key: 'objects', label: 'Rows in preview', numeric: true },
            { key: 'source', label: 'Source' },
            { key: 'state', label: 'State' }
          ],
          rows: summary
        }) +
        '<div class="panels"><div class="panel"><h2>Why devices are empty</h2><p>VMware vCenter refused the connection three times. No device record was created, and no device count was estimated. The gap is visible here rather than absorbed into a total.</p></div>' +
        '<div class="panel"><h2>Why AWS is empty</h2><p>The AWS account was excluded from the phase one scope. It is shown as not collected so that a reader cannot mistake zero for none.</p></div></div>'
      );
    }
  };

  var INV_TABS = [
    { id: 'people', label: 'People' },
    { id: 'apps', label: 'Applications' },
    { id: 'workspaces', label: 'Workspaces' },
    { id: 'sites', label: 'Sites' }
  ];

  var INV_TABLES = {
    people: {
      id: 'people',
      caption: 'Identity records, with source and state',
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'department', label: 'Department' },
        { key: 'role', label: 'Role' },
        { key: 'site', label: 'Site' },
        { key: 'source', label: 'Source' },
        { key: 'state', label: 'State' }
      ]
    },
    apps: {
      id: 'apps',
      caption: 'Applications and the source that named them',
      columns: [
        { key: 'name', label: 'Application' },
        { key: 'vendor', label: 'Vendor' },
        { key: 'category', label: 'Category' },
        { key: 'users', label: 'Users', numeric: true },
        { key: 'source', label: 'Source' },
        { key: 'state', label: 'State' }
      ]
    },
    workspaces: {
      id: 'workspaces',
      caption: 'Collaboration workspaces',
      columns: [
        { key: 'name', label: 'Workspace' },
        { key: 'type', label: 'Type' },
        { key: 'members', label: 'Members', numeric: true },
        { key: 'source', label: 'Source' },
        { key: 'state', label: 'State' }
      ]
    },
    sites: {
      id: 'sites',
      caption: 'Sites, with network and headcount where read',
      columns: [
        { key: 'name', label: 'Site' },
        { key: 'type', label: 'Type' },
        { key: 'country', label: 'Country' },
        { key: 'headcount', label: 'Headcount', numeric: true },
        { key: 'network', label: 'Network' },
        { key: 'state', label: 'State' }
      ]
    }
  };

  SCREENS.inventory = {
    title: 'Consolidated Enterprise Views',
    sub: 'One record per entity, with the source and state of every row.',
    render: function () {
      var activeTab = tabState.inventory || 'people';
      var spec = INV_TABLES[activeTab];
      spec.rows = DATA[activeTab === 'apps' ? 'apps' : activeTab];
      return (
        notice('Select a row to see the full record, its provenance and what its state means. Rows are sortable by column.') +
        '<div class="tabs" role="tablist" aria-label="Entity type">' +
        INV_TABS.map(function (t) {
          return (
            '<button class="tab" role="tab" type="button" data-tab="inventory" data-value="' +
            t.id +
            '" aria-selected="' +
            (activeTab === t.id ? 'true' : 'false') +
            '">' +
            esc(t.label) +
            '</button>'
          );
        }).join('') +
        '</div>' +
        table(spec) +
        legend()
      );
    }
  };

  var tabState = { inventory: 'people' };

  SCREENS.organisation = {
    title: 'Organisation Map',
    sub: 'Reporting shape of the target, and where the two organisations overlap.',
    render: function () {
      var byDept = {};
      DATA.people.forEach(function (p) {
        var d = p.department || 'Unknown';
        if (!byDept[d]) byDept[d] = { label: d, count: 0, conflicted: 0 };
        byDept[d].count += 1;
        if (p.state === 'conflicted' || p.state === 'unreadable') byDept[d].conflicted += 1;
      });
      var depts = Object.keys(byDept).map(function (k) {
        return byDept[k];
      });
      return (
        notice('Departments are derived from the identity attribute on each sample row. Unknown means the attribute was missing, not that the person is unassigned.') +
        '<div class="panels"><div class="panel"><h2>Headcount by department (sample rows)</h2>' +
        bars(depts.map(function (d) {
          return { label: d.label, value: d.count };
        })) +
        '</div><div class="panel"><h2>Where the record is unresolved</h2>' +
        leaders(
          depts
            .filter(function (d) {
              return d.conflicted > 0;
            })
            .map(function (d) {
              return { label: d.label, meta: d.conflicted + ' unresolved' };
            })
        ) +
        '</div><div class="panel"><h2>Reading this view</h2><p>Two organisations are mapped here: Northwind Holdings and Contoso Manufacturing. Duplicate roles are counted, not merged, because a duplicate role is a decision for the integration director rather than a data error.</p></div></div>'
      );
    }
  };

  SCREENS.governance = {
    title: 'M&A Governance',
    sub: 'Conflicts held open, decisions taken, and the workstreams that own them.',
    render: function () {
      return (
        notice('A conflict is information. The product will not resolve one silently: it stays visible until a named owner decides and the decision is recorded with a date.') +
        table({
          id: 'conflicts',
          caption: 'Conflict register',
          columns: [
            { key: 'topic', label: 'Conflict' },
            { key: 'a', label: 'Reading A' },
            { key: 'b', label: 'Reading B' },
            { key: 'owner', label: 'Owner' },
            { key: 'state', label: 'State' }
          ],
          rows: DATA.conflicts.map(function (c) {
            return Object.assign({}, c, { state: c.state === 'open' ? 'conflicted' : 'collected' });
          })
        }) +
        '<div class="panels"><div class="panel"><h2>Decision log</h2>' +
        leaders([
          { label: 'Rotterdam device count: AD reading adopted', meta: '08 Nov' },
          { label: 'Phase one scope excludes AWS', meta: '04 Nov' },
          { label: 'Telemetry stays disabled', meta: '04 Nov' }
        ]) +
        '</div><div class="panel"><h2>Open by owner</h2>' +
        leaders(
          DATA.conflicts
            .filter(function (c) {
              return c.state === 'open';
            })
            .map(function (c) {
              return { label: c.topic, meta: c.owner };
            })
        ) +
        '</div></div>'
      );
    }
  };

  SCREENS.analytics = {
    title: 'Analytics',
    sub: 'Measures over the record, each with the query behind it stated in the product.',
    render: function () {
      return (
        notice('These are sample measures over fictional rows. In an installation, every figure links to the query that produced it, so a reader can reproduce it.') +
        kpis([
          { label: 'Rows in record', value: '46', note: 'Sample data' },
          { label: 'Collected', value: '34', note: '74 per cent' },
          { label: 'Unresolved', value: '9', note: 'Conflicted or unreadable' },
          { label: 'Not collected', value: '3', note: 'Outside scope' }
        ]) +
        '<div class="panels"><div class="panel"><h2>Rows by source</h2>' +
        bars([
          { label: 'Microsoft 365', value: 4 },
          { label: 'Entra ID', value: 9 },
          { label: 'Active Directory', value: 10 },
          { label: 'Azure subscriptions', value: 2 },
          { label: 'Endpoint inventory', value: 3 },
          { label: 'VMware vCenter', value: 0 }
        ]) +
        '</div><div class="panel"><h2>Rows by state</h2>' +
        bars(
          [
            { label: 'Collected', value: 34 },
            { label: 'Partial', value: 4 },
            { label: 'Conflicted', value: 3 },
            { label: 'Unreadable', value: 2 },
            { label: 'Not collected', value: 3 }
          ],
          true
        ) +
        '</div></div>'
      );
    }
  };

  SCREENS.security = {
    title: 'Security',
    sub: 'Findings raised from the collected evidence, with the source of each.',
    render: function () {
      return (
        notice('A finding without evidence is an opinion. Each row below names the report it came from, and a row whose evidence could not be read says so.') +
        table({
          id: 'findings',
          caption: 'Findings',
          columns: [
            { key: 'id', label: 'Ref' },
            { key: 'title', label: 'Finding' },
            { key: 'severity', label: 'Severity' },
            { key: 'evidence', label: 'Evidence' },
            { key: 'state', label: 'State' }
          ],
          rows: DATA.findings
        })
      );
    }
  };

  SCREENS.compliance = {
    title: 'Compliance',
    sub: 'Obligations mapped against the estate, with coverage stated rather than implied.',
    render: function () {
      return (
        notice('Coverage is the number of controls with evidence attached, over the number in the framework. It is not an attestation and it is not a certification.') +
        table({
          id: 'compliance',
          caption: 'Framework coverage',
          columns: [
            { key: 'framework', label: 'Framework' },
            { key: 'mapped', label: 'Controls with evidence', numeric: true },
            { key: 'total', label: 'Controls', numeric: true },
            { key: 'state', label: 'State' }
          ],
          rows: DATA.compliance
        }) +
        '<div class="panels"><div class="panel"><h2>Not an audit</h2><p>This view helps a team prepare. It does not replace an auditor, and it does not produce an opinion.</p></div>' +
        '<div class="panel"><h2>Gaps by framework</h2>' +
        leaders(
          DATA.compliance.map(function (c) {
            return {
              label: c.framework,
              meta: c.total - c.mapped + ' open'
            };
          })
        ) +
        '</div></div>'
      );
    }
  };

  SCREENS.migration = {
    title: 'Migration',
    sub: 'Waves, what is in each, and whether the plan has been rehearsed against the record.',
    render: function () {
      return (
        notice('<strong>Nothing here executes.</strong> In an installation, a wave runs only after an operator approves it, and every action is attributable. In the preview, the button is disabled.') +
        table({
          id: 'waves',
          caption: 'Wave plan',
          columns: [
            { key: 'wave', label: 'Wave' },
            { key: 'name', label: 'Scope' },
            { key: 'entities', label: 'Entities', numeric: true },
            { key: 'rehearsed', label: 'Rehearsed' },
            { key: 'findings', label: 'Findings', numeric: true },
            { key: 'state', label: 'State' }
          ],
          rows: DATA.waves
        }) +
        '<p style="margin-top:1rem"><button class="btn" type="button" disabled title="Execution is disabled in the preview.">Approve wave</button></p>' +
        '<p class="mono" style="color:var(--ink-faint);margin-top:.4rem">Disabled in preview: no migration action is proposed, approved or executed.</p>'
      );
    }
  };

  SCREENS.cloudfit = {
    title: 'Cloud Fit',
    sub: 'Where each workload could run after close, and how confident the reading is.',
    render: function () {
      var placements = {
        Finance: 'SaaS, target tenant',
        Manufacturing: 'Retain on site, latency',
        HR: 'SaaS, target tenant',
        Procurement: 'SaaS, target tenant',
        Engineering: 'Retain on site, data volume',
        Operations: 'Retain on site, latency',
        Quality: 'SaaS, target tenant',
        Sales: 'SaaS, target tenant',
        Records: 'Archive, target tenant'
      };
      var rows = DATA.apps.map(function (a) {
        return {
          name: a.name,
          category: a.category,
          placement: placements[a.category] || 'Undecided',
          confidence: a.state === 'collected' ? 'Read' : a.state === 'partial' ? 'Partial' : 'No reading',
          state: a.state
        };
      });
      return (
        notice('Placement below is illustrative and written for this preview. In an installation it is derived from workload dependency, latency tolerance and landing zone readiness, not from a category lookup.') +
        table({
          id: 'cloudfit',
          caption: 'Workload placement',
          columns: [
            { key: 'name', label: 'Workload' },
            { key: 'category', label: 'Category' },
            { key: 'placement', label: 'Sample placement' },
            { key: 'confidence', label: 'Confidence' },
            { key: 'state', label: 'State' }
          ],
          rows: rows
        })
      );
    }
  };

  SCREENS.licensing = {
    title: 'Licensing Hub',
    sub: 'Entitlement against assignment, and the renewal dates that make it matter.',
    render: function () {
      var rows = DATA.licences.map(function (l) {
        return {
          product: l.product,
          entitled: l.entitled,
          assigned: l.assigned,
          variance: l.entitled ? l.entitled - l.assigned : 0,
          renewal: l.renewal,
          state: l.state
        };
      });
      return (
        notice('Variance is entitlement minus assignment. A positive number is unused capacity and a candidate for reduction. It is not automatically a saving: the remaining users need somewhere to go.') +
        table({
          id: 'licences',
          caption: 'Licence position',
          columns: [
            { key: 'product', label: 'Product' },
            { key: 'entitled', label: 'Entitled', numeric: true },
            { key: 'assigned', label: 'Assigned', numeric: true },
            { key: 'variance', label: 'Variance', numeric: true },
            { key: 'renewal', label: 'Renewal' },
            { key: 'state', label: 'State' }
          ],
          rows: rows
        }) +
        '<div class="panels"><div class="panel"><h2>Nearest renewal</h2><p>Endpoint protection renews on 15 December 2026, and its assignment data could not be read. That is the most expensive kind of gap: a renewal decision without a usage figure.</p></div>' +
        '<div class="panel"><h2>Not a finance view</h2><p>These are assignment counts, not cost. Price, discount and true-up mechanics live in the contract register.</p></div></div>'
      );
    }
  };

  SCREENS.operations = {
    title: 'Operations',
    sub: 'Post-close queues and day-one command. Nothing has started yet.',
    render: function () {
      return (
        notice('The target has not completed. These queues exist so that the shape of day one is agreed before it arrives, not after.') +
        table({
          id: 'ops',
          caption: 'Queues',
          columns: [
            { key: 'queue', label: 'Queue' },
            { key: 'open', label: 'Open', numeric: true },
            { key: 'owner', label: 'Owner' },
            { key: 'state', label: 'State' }
          ],
          rows: DATA.operations
        }) +
        '<div class="panels"><div class="panel"><h2>Day one</h2><p>Not started. Hypercare opens on the first working day after completion and runs until the estate is stable for two consecutive weeks.</p></div>' +
        '<div class="panel"><h2>Unassigned</h2><p>Two queues have no owner. An unowned queue on day one becomes the first incident of the integration.</p></div></div>'
      );
    }
  };

  SCREENS.reports = {
    title: 'Reports',
    sub: 'Defined outputs, who owns them, and whether they have been run.',
    render: function () {
      return (
        notice('A report that has not been run says so. There is no placeholder figure and no greyed-out chart pretending to be a result.') +
        table({
          id: 'reports',
          caption: 'Report definitions',
          columns: [
            { key: 'name', label: 'Report' },
            { key: 'owner', label: 'Owner' },
            { key: 'generated', label: 'Last run' },
            { key: 'state', label: 'State' }
          ],
          rows: DATA.reports
        })
      );
    }
  };

  SCREENS.aria = {
    title: 'Aria Assist',
    sub: 'A scoped assistant over the estate record. Sample transcript, not a live session.',
    render: function () {
      return (
        notice('This transcript is fixed sample text. The assistant is not connected in the preview, and nothing typed here is processed or stored.') +
        '<div class="transcript"><div class="transcript__row"><p class="transcript__who">Operator</p><p>' +
        esc(DATA.assistant.prompt) +
        '</p></div><div class="transcript__row"><p class="transcript__who">Aria</p><p>' +
        esc(DATA.assistant.answer) +
        '</p><ul class="transcript__cite">' +
        DATA.assistant.citations
          .map(function (c) {
            return '<li>' + esc(c) + '</li>';
          })
          .join('') +
        '</ul></div></div>' +
        '<div class="panels"><div class="panel"><h2>What it may do</h2><p>Read the record, summarise, and point at the evidence behind a figure. It answers with citations or it says it does not know.</p></div>' +
        '<div class="panel"><h2>What it may not do</h2><p>Change a record, run a collector, approve a wave or send data outside the installation. In the preview it does nothing at all.</p></div></div>'
      );
    }
  };

  SCREENS.help = {
    title: 'Help & Intelligence',
    sub: 'Operator guidance and the reference material shipped with the product.',
    render: function () {
      return (
        notice('Reference entries are listed, not linked, in the preview. The shipped product opens them in place.') +
        '<div class="panels"><div class="panel"><h2>Operator guides</h2>' +
        leaders([
          { label: 'Scoping a discovery run', meta: 'Guide' },
          { label: 'Designing a read-only credential', meta: 'Guide' },
          { label: 'Reading a conflict', meta: 'Guide' },
          { label: 'Rehearsing a wave', meta: 'Guide' },
          { label: 'Running a cut-over window', meta: 'Runbook' },
          { label: 'Exporting the record', meta: 'Reference' }
        ]) +
        '</div><div class="panel"><h2>Reference</h2>' +
        leaders([
          { label: 'Collector permission matrix', meta: 'Reference' },
          { label: 'Evidence file schema', meta: 'Schema' },
          { label: 'Role and permission model', meta: 'Reference' },
          { label: 'Release notes', meta: 'Changelog' }
        ]) +
        '</div></div>'
      );
    }
  };

  SCREENS.setup = {
    title: 'Setup',
    sub: 'Environment readiness for this installation.',
    render: function () {
      return (
        notice('Setup is read-only in the preview. Nothing can be installed, connected or changed from this page.') +
        table({
          id: 'setup',
          caption: 'Installation checklist',
          columns: [
            { key: 'item', label: 'Step' },
            { key: 'detail', label: 'Detail' },
            { key: 'state', label: 'State' }
          ],
          rows: DATA.setup.map(function (s) {
            return {
              item: s.item,
              detail: s.detail,
              state: s.state === 'done' ? 'collected' : 'not-collected'
            };
          })
        })
      );
    }
  };

  SCREENS.admin = {
    title: 'Administration',
    sub: 'Roles in this installation and what each one may do.',
    render: function () {
      return (
        notice('Role assignment is managed in the customer directory. The product reads membership; it does not create accounts.') +
        table({
          id: 'roles',
          caption: 'Roles',
          columns: [
            { key: 'role', label: 'Role' },
            { key: 'members', label: 'Members', numeric: true },
            { key: 'can', label: 'May do' }
          ],
          rows: DATA.roles
        })
      );
    }
  };

  SCREENS.settings = {
    title: 'Settings',
    sub: 'Retention, telemetry and evidence handling for this installation.',
    render: function () {
      return (
        notice('Settings are displayed as configured. They cannot be changed in the preview.') +
        defs([
          ['Telemetry', 'Disabled by customer decision, 04 Nov 2026'],
          ['Licence check', 'Online, weekly'],
          ['Evidence retention', 'Seven years, customer-managed key'],
          ['Log export', 'Local SIEM, daily'],
          ['Time zone', 'Europe/London'],
          ['Assistant model', 'Local, no external call'],
          ['Update channel', 'Scheduled, customer window']
        ]) +
        '<div class="panels"><div class="panel"><h2>Why telemetry is listed first</h2><p>It is the setting procurement asks about. It is disabled, and the decision and date are recorded rather than left as a default.</p></div></div>'
      );
    }
  };

  ['infrastructure', 'assets', 'integration', 'advanced'].forEach(function (id) {
    SCREENS[id] = {
      title: id.charAt(0).toUpperCase() + id.slice(1),
      sub: 'This surface exists in the product but is not part of the preview.',
      render: function () {
        return (
          notice('This navigation entry mirrors the shipped product. It is present so that the structure you see matches the structure you would install. Its content is not included in the preview.') +
          defs([
            ['Surface', id],
            ['State in preview', 'Not included'],
            ['Why', 'Held back to keep the preview to the surfaces that carry the interaction model']
          ])
        );
      }
    };
  });

  /* ---------- chrome ---------------------------------------------------- */

  function currentId() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'preview') return 'overview';
    var id = parts[1] || 'overview';
    return SCREENS[id] ? id : 'overview';
  }

  function buildSide(activeId) {
    var html = '';
    NAV.forEach(function (group) {
      html += '<div class="side__group"><p class="side__label">' + esc(group.group) + '</p>';
      group.items.forEach(function (item) {
        html +=
          '<a class="side__link" href="/preview/' +
          item.id +
          '"' +
          (item.id === activeId ? ' aria-current="page"' : '') +
          '>' +
          glyph(item.glyph) +
          '<span>' +
          esc(item.label) +
          '</span></a>';
      });
      html += '</div>';
    });
    side.innerHTML = html;
  }

  function findLabel(id) {
    for (var g = 0; g < NAV.length; g++) {
      for (var i = 0; i < NAV[g].items.length; i++) {
        if (NAV[g].items[i].id === id) return { label: NAV[g].items[i].label, group: NAV[g].group };
      }
    }
    return { label: 'Overview', group: 'Start here' };
  }

  function render() {
    var id = currentId();
    var screen = SCREENS[id];
    var found = findLabel(id);
    buildSide(id);
    crumb.innerHTML = '<span>' + esc(found.group) + '</span><span class="crumb__sep">/</span><strong>' + esc(found.label) + '</strong>';
    root.innerHTML =
      '<div class="page-head"><div><h1>' +
      esc(screen.title) +
      '</h1><p>' +
      esc(screen.sub) +
      '</p></div><div class="page-head__meta"><p>Sample data</p><p>' +
      esc(DATA.meta.version) +
      '</p></div></div>' +
      screen.render();
    document.title = screen.title + ' · ACQI preview';
    if (lastScreen !== id) {
      window.scrollTo(0, 0);
      lastScreen = id;
    }
  }

  var lastScreen = null;

  /* ---------- interaction ----------------------------------------------- */

  function closeDrawer() {
    var drawer = document.getElementById('drawer');
    var scrim = document.getElementById('scrim');
    if (drawer) drawer.dataset.open = 'false';
    if (scrim) scrim.dataset.open = 'false';
    var selected = root.querySelector('tr[aria-selected="true"]');
    if (selected) selected.removeAttribute('aria-selected');
  }

  function openDrawer(tableId, index, trigger) {
    var rows = TABLE_CACHE[tableId];
    if (!rows || !rows[index]) return;
    var row = rows[index];
    var drawer = document.getElementById('drawer');
    var scrim = document.getElementById('scrim');
    var title = row[Object.keys(row)[0]];

    var body = Object.keys(row)
      .map(function (key) {
        var value = row[key];
        if (key === 'state') {
          return '<div><dt>State</dt><dd>' + stateChip(value) + '</dd></div>';
        }
        return '<div><dt>' + esc(key) + '</dt><dd>' + esc(value) + '</dd></div>';
      })
      .join('');

    var stateKey = row.state ? String(row.state) : null;
    drawer.innerHTML =
      '<div class="drawer__head"><h2>' +
      esc(title) +
      '</h2><button class="drawer__close" type="button" data-close="1">Close</button></div>' +
      '<div class="drawer__body">' +
      (stateKey ? '<div class="drawer__state">' + stateChip(stateKey) + '</div>' : '') +
      '<dl class="defs">' +
      body +
      '</dl>' +
      (stateKey ? '<p class="drawer__note">' + esc(STATE_HELP[stateKey] || '') + '</p>' : '') +
      '<p class="drawer__note">Read-only record. No field can be edited in the preview.</p></div>';

    drawer.dataset.open = 'true';
    scrim.dataset.open = 'true';

    if (trigger) trigger.setAttribute('aria-selected', 'true');
    var closeBtn = drawer.querySelector('[data-close]');
    if (closeBtn) closeBtn.focus();
  }

  root.addEventListener('click', function (event) {
    var sortBtn = event.target.closest('[data-sort]');
    if (sortBtn) {
      var id = sortBtn.getAttribute('data-sort');
      var key = sortBtn.getAttribute('data-key');
      var current = sortState[id] || { key: null, dir: null };
      var dir = current.key === key && current.dir === 'asc' ? 'desc' : 'asc';
      sortState[id] = { key: key, dir: dir };
      render();
      return;
    }

    var tabBtn = event.target.closest('[data-tab]');
    if (tabBtn) {
      tabState[tabBtn.getAttribute('data-tab')] = tabBtn.getAttribute('data-value');
      render();
      return;
    }

    var row = event.target.closest('tr[data-table]');
    if (row) {
      openDrawer(row.getAttribute('data-table'), Number(row.getAttribute('data-index')), row);
    }
  });

  root.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    var row = event.target.closest('tr[data-table]');
    if (!row) return;
    event.preventDefault();
    openDrawer(row.getAttribute('data-table'), Number(row.getAttribute('data-index')), row);
  });

  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-close]')) closeDrawer();
    if (event.target.id === 'scrim') closeDrawer();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeDrawer();
  });

  render();
})();
