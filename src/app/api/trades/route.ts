import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedTaxonomyOnly } from '@/lib/db/seed-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();

    // Ensure taxonomy is populated if database was partially initialized
    const tradeCheck = db.prepare("SELECT COUNT(*) as count FROM trades WHERE id != 'trade_other'").get() as { count: number } | undefined;
    if (!tradeCheck || tradeCheck.count < 11) {
      seedTaxonomyOnly(db);
    }

    // 1. Fetch trades
    const trades: any[] = db
      .prepare('SELECT id, slug, name_en, name_ar, icon, order_index, sort_order FROM trades ORDER BY order_index ASC')
      .all();

    // 2. Fetch subcategories
    const subcategories: any[] = db
      .prepare('SELECT id, trade_id, slug, name_en, name_ar, is_elv FROM subcategories ORDER BY name_en ASC')
      .all();

    // 3. Fetch symptoms
    const symptoms: any[] = db
      .prepare(`
        SELECT id, subcategory_id, symptom_en, symptom_ar, name_en, name_ar,
               default_severity, default_urgency, is_hazard, hazard_type,
               hazard_instruction_en, hazard_instruction_ar, hazard_warning_en, hazard_warning_ar
        FROM fault_symptoms
      `)
      .all();

    // Group symptoms by subcategory_id
    const symptomsBySubcat = new Map<string, any[]>();
    for (const sym of symptoms) {
      const list = symptomsBySubcat.get(sym.subcategory_id) || [];
      list.push({
        ...sym,
        is_hazard: Boolean(sym.is_hazard),
      });
      symptomsBySubcat.set(sym.subcategory_id, list);
    }

    // Group subcategories by trade_id
    const subcatsByTrade = new Map<string, any[]>();
    for (const sub of subcategories) {
      const list = subcatsByTrade.get(sub.trade_id) || [];
      list.push({
        ...sub,
        is_elv: Boolean(sub.is_elv),
        symptoms: symptomsBySubcat.get(sub.id) || [],
      });
      subcatsByTrade.set(sub.trade_id, list);
    }

    // Assemble 3-tier hierarchy tree
    const result = trades.map((t) => ({
      ...t,
      subcategories: subcatsByTrade.get(t.id) || [],
    }));

    return NextResponse.json({ trades: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
