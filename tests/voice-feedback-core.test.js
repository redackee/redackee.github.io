import { describe, expect, it } from 'vitest';
import core from '../assets/js/voice-feedback-core.js';

describe('voice-feedback-core', function() {
  it('normalizes prompts by collapsing whitespace', function() {
    expect(core.normalizePromptText(' Hello\n  there   friend ')).toBe('Hello there friend');
  });

  it('resolves the configured baseurl without a trailing slash', function() {
    expect(core.resolveSiteBaseurl({ siteBaseurl: '/redackee.github.io/' })).toBe('/redackee.github.io');
    expect(core.resolveSiteBaseurl({})).toBe('');
  });

  it('builds asset urls correctly for root and nested baseurls', function() {
    expect(core.buildAssetUrl('', 'feedback_prompts/action_prompt.txt')).toBe('/feedback_prompts/action_prompt.txt');
    expect(core.buildAssetUrl('/redackee.github.io', '/assets/js/voice-feedback.js')).toBe('/redackee.github.io/assets/js/voice-feedback.js');
  });

  it('extracts recognizer text from final and partial results', function() {
    expect(core.extractRecognizerText({ result: { text: 'hello world' } })).toBe('hello world');
    expect(core.extractRecognizerText({ result: { partial: 'hello' } })).toBe('hello');
  });

  it('prefers vosk when the model is ready', function() {
    expect(core.pickTranscriptionMode({ voskReady: true, webSpeechSupported: true, voskLoading: false })).toBe('vosk');
    expect(core.pickTranscriptionMode({ voskReady: false, webSpeechSupported: true, voskLoading: false })).toBe('webspeech');
    expect(core.pickTranscriptionMode({ voskReady: false, webSpeechSupported: false, voskLoading: true })).toBe('vosk-loading');
    expect(core.pickTranscriptionMode({ voskReady: false, webSpeechSupported: false, voskLoading: false })).toBe('unsupported');
  });

  it('builds modal content that matches static-only behavior', function() {
    const success = core.buildModalContent({ state: 'success', transcript: 'A useful suggestion' });
    const unsupported = core.buildModalContent({ state: 'unsupported' });

    expect(success.title).toBe('Thanks for the feedback');
    expect(success.transcript).toBe('A useful suggestion');
    expect(success.privacy).toContain('does not save feedback');
    expect(unsupported.title).toBe('Voice transcription unavailable');
  });

  it('maps recognition errors to stable UI states', function() {
    expect(core.mapRecognitionError('not-allowed')).toBe('permission-denied');
    expect(core.mapRecognitionError('no-speech')).toBe('no-speech');
    expect(core.mapRecognitionError('network')).toBe('error');
  });
});