import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto'; // For generating unique IDs

// --- Test Setup ---
const TEST_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const TEST_SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!TEST_SUPABASE_URL || !TEST_SUPABASE_SERVICE_KEY) {
    throw new Error('Test Supabase URL/Service Key not set in environment variables for DB tests');
}

const testSupabaseAdmin: SupabaseClient = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_KEY);

// --- Test Data Prefixes/Suffixes ---
const TEST_ID_SUFFIX = '-db-test';
const generateTestPrivyId = () => `${randomUUID()}${TEST_ID_SUFFIX}`;
const generateTestEmail = () => `${randomUUID()}${TEST_ID_SUFFIX}@example.com`;
const generateTestProjectId = () => randomUUID(); // Use random UUID for project ID if needed

// --- Test Helper Functions ---
async function cleanupTestData() {
    console.log('[DB Test Cleanup] Cleaning up test data...');
    const tables = [
        'user_discord_info',
        'requirement_progress',
        'nft_metadata',
        'user_levels',
        'profiles'
        // Note: level_requirements are not cleaned up automatically by privy_id
    ];

    for (const table of tables) {
        const deleteQuery = testSupabaseAdmin.from(table).delete();
        let result;
        // Check if privy_id exists in the first row (if any)
        const checkData = (await testSupabaseAdmin.from(table).select('privy_id', { head: true, count: 'exact' })).data?.[0];

        if ('privy_id' in (checkData ?? {})) { // Group the ?? check
            result = await deleteQuery.ilike('privy_id', `%${TEST_ID_SUFFIX}`);
        }
        // Explicitly check for requirement_progress table AND if privy_id exists in its checkData
        else if (table === 'requirement_progress' && ('privy_id' in (checkData ?? {}))) { // Added parentheses here
            result = await deleteQuery.ilike('privy_id', `%${TEST_ID_SUFFIX}`);
        }
        else {
            console.warn(`[DB Test Cleanup] Skipping cleanup for table ${table} due to unknown ID column or structure.`);
            continue;
        }

        if (result?.error) {
            if (result.error.code !== '42P01') {
                console.error(`[DB Test Cleanup] Error cleaning table ${table}:`, result.error.message);
            }
        } else {
            console.log(`[DB Test Cleanup] Cleaned ${result?.count ?? 0} rows from ${table}`);
        }
    }
    // Clean up test level requirements separately
    await testSupabaseAdmin.from('level_requirements').delete().gte('level', 90); // Clean test levels >= 90
    console.log('[DB Test Cleanup] Finished cleanup.');
}

// --- Test Suite ---
describe('Supabase Schema Integration Tests (setup-db.ts)', () => {

    beforeAll(async () => {
        await cleanupTestData();
    });

    afterAll(async () => {
        await cleanupTestData();
    });

    // --- Profiles Table Tests ---
    describe('profiles table', () => {
        let testPrivyId: string;

        beforeEach(() => {
            testPrivyId = generateTestPrivyId();
        });

        afterEach(async () => {
            await testSupabaseAdmin.from('profiles').delete().eq('privy_id', testPrivyId);
        });

        it('should allow inserting a valid profile', async () => {
            const { data, error } = await testSupabaseAdmin.from('profiles').insert({
                privy_id: testPrivyId,
                full_name: 'Test User',
                email: generateTestEmail(),
                project_name: 'Test Project',
                project_description: 'Desc', project_vision: 'Vision',
                scientific_references: 'Ref', credential_links: 'Link',
                team_members: 'Team', motivation: 'Motiv', progress: 'Prog'
            }).select();

            expect(error).toBeNull();
            expect(data).toHaveLength(1);
            expect(data?.[0].privy_id).toBe(testPrivyId);
        });

        it('should prevent inserting duplicate privy_id', async () => {
            await testSupabaseAdmin.from('profiles').insert({ privy_id: testPrivyId, full_name: 'A', email: generateTestEmail(), project_name: 'P', project_description: 'D', project_vision: 'V', scientific_references: 'R', credential_links: 'L', team_members: 'T', motivation: 'M', progress: 'Pr' });
            const { error } = await testSupabaseAdmin.from('profiles').insert({ privy_id: testPrivyId, full_name: 'B', email: generateTestEmail(), project_name: 'P2', project_description: 'D2', project_vision: 'V2', scientific_references: 'R2', credential_links: 'L2', team_members: 'T2', motivation: 'M2', progress: 'Pr2' });
            expect(error).not.toBeNull();
            expect(error?.code).toBe('23505'); // Unique violation
        });

        it('should allow selecting an existing profile', async () => {
            await testSupabaseAdmin.from('profiles').insert({ privy_id: testPrivyId, full_name: 'Select Me', email: generateTestEmail(), project_name: 'P', project_description: 'D', project_vision: 'V', scientific_references: 'R', credential_links: 'L', team_members: 'T', motivation: 'M', progress: 'Pr' });
            const { data, error } = await testSupabaseAdmin.from('profiles').select('*').eq('privy_id', testPrivyId).single();
            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data?.full_name).toBe('Select Me');
        });

        it('should allow updating an existing profile', async () => {
            await testSupabaseAdmin.from('profiles').insert({ privy_id: testPrivyId, full_name: 'Update Me', email: generateTestEmail(), project_name: 'P', project_description: 'D', project_vision: 'V', scientific_references: 'R', credential_links: 'L', team_members: 'T', motivation: 'M', progress: 'Pr' });
            const { error: updateError } = await testSupabaseAdmin.from('profiles').update({ full_name: 'Updated Name' }).eq('privy_id', testPrivyId);
            expect(updateError).toBeNull();
            const { data: updatedData, error: selectError } = await testSupabaseAdmin.from('profiles').select('full_name').eq('privy_id', testPrivyId).single();
            expect(selectError).toBeNull();
            expect(updatedData?.full_name).toBe('Updated Name');
        });

        it('should allow deleting an existing profile', async () => {
            await testSupabaseAdmin.from('profiles').insert({ privy_id: testPrivyId, full_name: 'Delete Me', email: generateTestEmail(), project_name: 'P', project_description: 'D', project_vision: 'V', scientific_references: 'R', credential_links: 'L', team_members: 'T', motivation: 'M', progress: 'Pr' });
            const { error: deleteError } = await testSupabaseAdmin.from('profiles').delete().eq('privy_id', testPrivyId);
            expect(deleteError).toBeNull();
            const { data: selectData, error: selectError } = await testSupabaseAdmin.from('profiles').select('*').eq('privy_id', testPrivyId).maybeSingle();
            expect(selectError).toBeNull();
            expect(selectData).toBeNull();
        });
    });

    // --- user_levels Table Tests ---
    describe('user_levels table', () => {
        let profilePrivyId: string;

        beforeAll(async () => {
            profilePrivyId = generateTestPrivyId();
            await testSupabaseAdmin.from('profiles').insert({ privy_id: profilePrivyId, full_name: 'Level User', email: generateTestEmail(), project_name: 'P', project_description: 'D', project_vision: 'V', scientific_references: 'R', credential_links: 'L', team_members: 'T', motivation: 'M', progress: 'Pr' });
        });

        afterAll(async () => {
            await testSupabaseAdmin.from('user_levels').delete().eq('privy_id', profilePrivyId);
            await testSupabaseAdmin.from('profiles').delete().eq('privy_id', profilePrivyId);
        });

        afterEach(async () => {
            // Clean specific level created in tests
            await testSupabaseAdmin.from('user_levels').delete().eq('privy_id', profilePrivyId);
        });

        it('should allow inserting a user level', async () => {
            const { data, error } = await testSupabaseAdmin.from('user_levels').insert({ privy_id: profilePrivyId, level: 1 }).select();
            expect(error).toBeNull();
            expect(data).toHaveLength(1);
            expect(data?.[0].level).toBe(1);
        });

        it('should allow upserting (updating) a user level', async () => {
            await testSupabaseAdmin.from('user_levels').insert({ privy_id: profilePrivyId, level: 1 });
            const { error: upsertError } = await testSupabaseAdmin.from('user_levels').upsert({ privy_id: profilePrivyId, level: 2 }, { onConflict: 'privy_id' });
            expect(upsertError).toBeNull();
            const { data: selectData, error: selectError } = await testSupabaseAdmin.from('user_levels').select('level').eq('privy_id', profilePrivyId).single();
            expect(selectError).toBeNull();
            expect(selectData?.level).toBe(2);
        });
    });

    // --- level_requirements Table Tests ---
    describe('level_requirements table', () => {
        const testLevel = 99;

        afterEach(async () => {
            await testSupabaseAdmin.from('level_requirements').delete().eq('level', testLevel);
        });

        it('should allow inserting level requirements', async () => {
            const requirementsConfig = { test: 'data', reqs: [1, 2] };
            const { data, error } = await testSupabaseAdmin.from('level_requirements').insert({
                level: testLevel,
                description: 'Test Level Desc',
                requirements_config: requirementsConfig
            }).select();
            expect(error).toBeNull();
            expect(data).toHaveLength(1);
            expect(data?.[0].level).toBe(testLevel);
            expect(data?.[0].requirements_config).toEqual(requirementsConfig);
        });

        it('should prevent inserting duplicate level number', async () => {
            await testSupabaseAdmin.from('level_requirements').insert({ level: testLevel, description: 'A', requirements_config: {} });
            const { error } = await testSupabaseAdmin.from('level_requirements').insert({ level: testLevel, description: 'B', requirements_config: {} });
            expect(error).not.toBeNull();
            expect(error?.code).toBe('23505'); // Unique violation
        });

        it('should allow updating level requirements', async () => {
            await testSupabaseAdmin.from('level_requirements').insert({ level: testLevel, description: 'Update Me', requirements_config: {} });
            const newConfig = { updated: true };
            const { error: updateError } = await testSupabaseAdmin.from('level_requirements')
                .update({ description: 'Updated Desc', requirements_config: newConfig })
                .eq('level', testLevel);
            expect(updateError).toBeNull();
            const { data: selectData, error: selectError } = await testSupabaseAdmin.from('level_requirements').select('*').eq('level', testLevel).single();
            expect(selectError).toBeNull();
            expect(selectData?.description).toBe('Updated Desc');
            expect(selectData?.requirements_config).toEqual(newConfig);
        });
    });

    // --- requirement_progress Table Tests ---
    describe('requirement_progress table', () => {
        let profilePrivyId: string;
        const testLevel = 1;
        const testReq = 'test_req' + TEST_ID_SUFFIX;

        beforeAll(async () => {
            profilePrivyId = generateTestPrivyId();
            await testSupabaseAdmin.from('profiles').insert({ privy_id: profilePrivyId, full_name: 'Req User', email: generateTestEmail(), project_name: 'P', project_description: 'D', project_vision: 'V', scientific_references: 'R', credential_links: 'L', team_members: 'T', motivation: 'M', progress: 'Pr' });
            await testSupabaseAdmin.from('user_levels').insert({ privy_id: profilePrivyId, level: testLevel });
        });

        afterAll(async () => {
            // Use general cleanup
        });

        afterEach(async () => {
            await testSupabaseAdmin.from('requirement_progress').delete().eq('privy_id', profilePrivyId).eq('level', testLevel).eq('requirement', testReq);
        });

        it('should allow inserting a requirement progress record', async () => {
            const { data, error } = await testSupabaseAdmin.from('requirement_progress').insert({
                privy_id: profilePrivyId,
                level: testLevel,
                requirement: testReq,
                completed: false
            }).select();
            expect(error).toBeNull();
            expect(data).toHaveLength(1);
            expect(data?.[0].completed).toBe(false);
        });

        it('should prevent inserting duplicate (privy_id, level, requirement)', async () => {
            await testSupabaseAdmin.from('requirement_progress').insert({ privy_id: profilePrivyId, level: testLevel, requirement: testReq, completed: false });
            const { error } = await testSupabaseAdmin.from('requirement_progress').insert({ privy_id: profilePrivyId, level: testLevel, requirement: testReq, completed: true });
            expect(error).not.toBeNull();
            expect(error?.code).toBe('23505'); // Unique violation
        });

        it('should allow upserting (updating) requirement progress', async () => {
            await testSupabaseAdmin.from('requirement_progress').insert({ privy_id: profilePrivyId, level: testLevel, requirement: testReq, completed: false });
            const { error: upsertError } = await testSupabaseAdmin.from('requirement_progress').upsert({
                privy_id: profilePrivyId,
                level: testLevel,
                requirement: testReq,
                completed: true,
                completed_at: new Date().toISOString()
            }, { onConflict: 'privy_id, level, requirement' });
            expect(upsertError).toBeNull();
            const { data: selectData, error: selectError } = await testSupabaseAdmin.from('requirement_progress').select('completed, completed_at').eq('privy_id', profilePrivyId).eq('level', testLevel).eq('requirement', testReq).single();
            expect(selectError).toBeNull();
            expect(selectData?.completed).toBe(true);
            expect(selectData?.completed_at).not.toBeNull();
        });
    });

    // --- nft_metadata Table Tests ---
    describe('nft_metadata table', () => {
        let profilePrivyId: string;
        let testProjectId: string;

        beforeAll(async () => {
            profilePrivyId = generateTestPrivyId();
            testProjectId = generateTestProjectId();
            await testSupabaseAdmin.from('profiles').insert({ privy_id: profilePrivyId, full_name: 'NFT User', email: generateTestEmail(), project_name: 'P', project_description: 'D', project_vision: 'V', scientific_references: 'R', credential_links: 'L', team_members: 'T', motivation: 'M', progress: 'Pr' });
        });

        afterAll(async () => {
            // Use general cleanup
        });

        afterEach(async () => {
            await testSupabaseAdmin.from('nft_metadata').delete().eq('privy_id', profilePrivyId);
        });

        it('should allow inserting NFT metadata', async () => {
            const { data, error } = await testSupabaseAdmin.from('nft_metadata').insert({
                privy_id: profilePrivyId,
                project_id: testProjectId,
                token_id: 'token123',
                contract_address: '0x123',
                metadata_uri: 'ipfs://meta',
                image_uri: 'ipfs://image',
                type: 'idea',
                status: 'pending'
            }).select();
            expect(error).toBeNull();
            expect(data).toHaveLength(1);
            expect(data?.[0].type).toBe('idea');
            expect(data?.[0].status).toBe('pending');
        });

        it('should allow updating NFT status', async () => {
            const { data: insertData } = await testSupabaseAdmin.from('nft_metadata').insert({
                privy_id: profilePrivyId, project_id: testProjectId, token_id: 'token-upd', contract_address: '0x123',
                metadata_uri: 'ipfs://meta', image_uri: 'ipfs://image', type: 'idea', status: 'pending'
            }).select().single();
            if (!insertData?.id) throw new Error('Insert failed');

            const { error: updateError } = await testSupabaseAdmin.from('nft_metadata')
                .update({ status: 'minted' })
                .eq('id', insertData.id);
            expect(updateError).toBeNull();
            const { data: selectData, error: selectError } = await testSupabaseAdmin.from('nft_metadata').select('status').eq('id', insertData.id).single();
            expect(selectError).toBeNull();
            expect(selectData?.status).toBe('minted');
        });
    });

    // --- user_discord_info Table Tests ---
    describe('user_discord_info table', () => {
        let profilePrivyId: string;

        beforeAll(async () => {
            profilePrivyId = generateTestPrivyId();
            await testSupabaseAdmin.from('profiles').insert({ privy_id: profilePrivyId, full_name: 'Discord User', email: generateTestEmail(), project_name: 'P', project_description: 'D', project_vision: 'V', scientific_references: 'R', credential_links: 'L', team_members: 'T', motivation: 'M', progress: 'Pr' });
        });

        afterAll(async () => {
            // Use general cleanup
        });

        afterEach(async () => {
            await testSupabaseAdmin.from('user_discord_info').delete().eq('privy_id', profilePrivyId);
        });

        it('should allow inserting discord info for existing profile', async () => {
            const { data, error } = await testSupabaseAdmin.from('user_discord_info').insert({
                privy_id: profilePrivyId,
                server_id: 'server123',
                invite_link: 'https://discord.gg/test'
            }).select();
            expect(error).toBeNull();
            expect(data).toHaveLength(1);
            expect(data?.[0].server_id).toBe('server123');
            expect(data?.[0].bot_invited).toBe(false);
        });

        it('should fail inserting discord info for non-existent profile (FK violation)', async () => {
            const nonExistentPrivyId = generateTestPrivyId();
            const { error } = await testSupabaseAdmin.from('user_discord_info').insert({
                privy_id: nonExistentPrivyId,
                server_id: 'server456',
                invite_link: 'https://discord.gg/fail'
            });
            expect(error).not.toBeNull();
            expect(error?.code).toBe('23503'); // FK violation
        });

        it('should allow upserting (updating) discord info', async () => {
            await testSupabaseAdmin.from('user_discord_info').insert({ privy_id: profilePrivyId, server_id: 's1', invite_link: 'link1' });
            const { error: upsertError } = await testSupabaseAdmin.from('user_discord_info').upsert({
                privy_id: profilePrivyId,
                server_id: 's2-updated',
                invite_link: 'link2-updated',
                bot_invited: true
            }, { onConflict: 'privy_id' });
            expect(upsertError).toBeNull();
            const { data: selectData, error: selectError } = await testSupabaseAdmin.from('user_discord_info').select('*').eq('privy_id', profilePrivyId).single();
            expect(selectError).toBeNull();
            expect(selectData?.server_id).toBe('s2-updated');
            expect(selectData?.invite_link).toBe('link2-updated');
            expect(selectData?.bot_invited).toBe(true);
        });

        it('should cascade delete discord info when profile is deleted', async () => {
            const tempPrivyId = generateTestPrivyId();
            await testSupabaseAdmin.from('profiles').insert({ privy_id: tempPrivyId, full_name: 'Cascade User', email: generateTestEmail(), project_name: 'P', project_description: 'D', project_vision: 'V', scientific_references: 'R', credential_links: 'L', team_members: 'T', motivation: 'M', progress: 'Pr' });
            await testSupabaseAdmin.from('user_discord_info').insert({ privy_id: tempPrivyId, server_id: 'cascade-server', invite_link: 'cascade-link' });
            const { count: initialCount, error: countError } = await testSupabaseAdmin.from('user_discord_info').select('* ', { count: 'exact', head: true }).eq('privy_id', tempPrivyId);
            expect(countError).toBeNull();
            expect(initialCount).toBe(1);

            const { error: deleteProfileError } = await testSupabaseAdmin.from('profiles').delete().eq('privy_id', tempPrivyId);
            expect(deleteProfileError).toBeNull();

            const { count: finalCount, error: finalCountError } = await testSupabaseAdmin.from('user_discord_info').select('* ', { count: 'exact', head: true }).eq('privy_id', tempPrivyId);
            expect(finalCountError).toBeNull();
            expect(finalCount).toBe(0);
        });
    });

});
