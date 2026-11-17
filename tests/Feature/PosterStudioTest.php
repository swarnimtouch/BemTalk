<?php

namespace Tests\Feature;

use Tests\TestCase;

class PosterStudioTest extends TestCase
{
    public function test_poster_studio_is_available(): void
    {
        $response = $this->get('/');

        $response->assertOk()
            ->assertSee('BemTalk Poster Studio')
            ->assertSee('Choose a photo')
            ->assertSee('Crop and position photo')
            ->assertSee('Download both')
            ->assertSee('Download ZIP')
            ->assertSee('Download PDF')
            ->assertSee('Nothing is uploaded or saved.');
    }

    public function test_home_page_does_not_submit_or_store_poster_data(): void
    {
        $response = $this->post('/', ['speakerName' => 'Test Doctor']);

        $response->assertStatus(405);
    }
}
