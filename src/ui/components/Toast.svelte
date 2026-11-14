<script lang="ts">
  import { toast } from '@/ui/toast';
</script>

<div class="toast" class:show={$toast !== null} role="status" aria-live="polite">{$toast ?? ''}</div>

<style>
  .toast {
    position: fixed;
    bottom: max(20px, env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    z-index: 999;
    max-width: calc(100% - 32px);
    background: #22362c;
    color: #fff;
    padding: 10px 18px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s, transform 0.2s;
  }
  .toast.show {
    opacity: 1;
  }
</style>

