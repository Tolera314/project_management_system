import { sendEmail, getOTPVerificationTemplate, getPlatformWelcomeTemplate, getTaskAssignedEmailTemplate, getWorkspaceInvitationTemplate, getProjectInvitationTemplate } from '../lib/email';
import 'dotenv/config';

/**
 * Email Test Script
 * 
 * Usage: 
 * TEST_EMAIL=your@email.com npx ts-node src/scripts/test-emails.ts
 */

const testEmails = async () => {
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';

    console.log('==================================');
    console.log('Email Notification Test Suite');
    console.log('==================================');
    console.log(`Test recipient: ${testEmail}\n`);

    const results = {
        passed: 0,
        failed: 0,
        tests: [] as any[]
    };

    // Test 1: OTP Email
    try {
        console.log('📧 Test 1: OTP Verification Email...');
        await sendEmail({
            to: testEmail,
            subject: '[TEST] OTP Verification - ProjectOS',
            html: getOTPVerificationTemplate('123456')
        });
        console.log('   ✅ OTP email sent successfully\n');
        results.passed++;
        results.tests.push({ name: 'OTP Email', status: 'PASS' });
    } catch (e: any) {
        console.error('   ❌ OTP email failed:', e.message, '\n');
        results.failed++;
        results.tests.push({ name: 'OTP Email', status: 'FAIL', error: e.message });
    }

    // Test 2: Welcome Email
    try {
        console.log('📧 Test 2: Platform Welcome Email...');
        await sendEmail({
            to: testEmail,
            subject: '[TEST] Welcome to ProjectOS',
            html: getPlatformWelcomeTemplate('Test User')
        });
        console.log('   ✅ Welcome email sent successfully\n');
        results.passed++;
        results.tests.push({ name: 'Welcome Email', status: 'PASS' });
    } catch (e: any) {
        console.error('   ❌ Welcome email failed:', e.message, '\n');
        results.failed++;
        results.tests.push({ name: 'Welcome Email', status: 'FAIL', error: e.message });
    }

    // Test 3: Task Assignment
    try {
        console.log('📧 Test 3: Task Assignment Email...');
        await sendEmail({
            to: testEmail,
            subject: '[TEST] New Task Assignment',
            html: getTaskAssignedEmailTemplate(
                'Implement File Upload Feature',
                'Project Management System',
                'Admin User',
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/test-id?taskId=task-123`
            )
        });
        console.log('   ✅ Task assignment email sent successfully\n');
        results.passed++;
        results.tests.push({ name: 'Task Assignment Email', status: 'PASS' });
    } catch (e: any) {
        console.error('   ❌ Task assignment email failed:', e.message, '\n');
        results.failed++;
        results.tests.push({ name: 'Task Assignment Email', status: 'FAIL', error: e.message });
    }

    // Test 4: Workspace Invitation
    try {
        console.log('📧 Test 4: Workspace Invitation Email...');
        await sendEmail({
            to: testEmail,
            subject: '[TEST] Workspace Invitation',
            html: getWorkspaceInvitationTemplate(
                'Engineering Team',
                'Admin User',
                'Team Member',
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/test-token`
            )
        });
        console.log('   ✅ Workspace invitation email sent successfully\n');
        results.passed++;
        results.tests.push({ name: 'Workspace Invitation', status: 'PASS' });
    } catch (e: any) {
        console.error('   ❌ Workspace invitation email failed:', e.message, '\n');
        results.failed++;
        results.tests.push({ name: 'Workspace Invitation', status: 'FAIL', error: e.message });
    }

    // Test 5: Project Invitation
    try {
        console.log('📧 Test 5: Project Invitation Email...');
        await sendEmail({
            to: testEmail,
            subject: '[TEST] Project Invitation',
            html: getProjectInvitationTemplate(
                'Mobile App Development',
                'Project Manager',
                'Developer',
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/test-token`
            )
        });
        console.log('   ✅ Project invitation email sent successfully\n');
        results.passed++;
        results.tests.push({ name: 'Project Invitation', status: 'PASS' });
    } catch (e: any) {
        console.error('   ❌ Project invitation email failed:', e.message, '\n');
        results.failed++;
        results.tests.push({ name: 'Project Invitation', status: 'FAIL', error: e.message });
    }

    // Summary
    console.log('==================================');
    console.log('Test Results Summary');
    console.log('==================================');
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log('==================================\n');

    if (results.failed > 0) {
        console.log('Failed Tests:');
        results.tests.filter(t => t.status === 'FAIL').forEach(t => {
            console.log(`  - ${t.name}: ${t.error}`);
        });
        process.exit(1);
    } else {
        console.log('🎉 All email tests passed!');
        console.log(`\nCheck ${testEmail} inbox for test emails.`);
        process.exit(0);
    }
};

// Run tests
testEmails().catch(err => {
    console.error('Fatal error running email tests:', err);
    process.exit(1);
});
