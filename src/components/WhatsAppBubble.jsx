// Shared WhatsApp-style message bubble used by the TemplateBuilder live
// preview and the Templates page preview dialog.
import { Box, Stack, Typography, Divider } from '@mui/material';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';

export const BUTTON_ICONS = {
  QUICK_REPLY: <ChatBubbleOutlineRoundedIcon fontSize="small" />,
  URL: <LinkRoundedIcon fontSize="small" />,
  PHONE_NUMBER: <CallRoundedIcon fontSize="small" />,
  COPY_CODE: <ContentCopyRoundedIcon fontSize="small" />,
  FLOW: <AccountTreeRoundedIcon fontSize="small" />,
  CATALOG: <StorefrontRoundedIcon fontSize="small" />,
};

export function extractVars(text) {
  const vars = [];
  const re = /\{\{(\d+)\}\}/g;
  let m;
  while ((m = re.exec(text || '')) !== null) vars.push(m[1]);
  return vars;
}

export function renderVarChips(text, filledValues) {
  const parts = [];
  let last = 0;
  let k = 0;
  const re = /{{(\d+)}}/g;
  let m;
  while ((m = re.exec(text || '')) !== null) {
    if (m.index > last) parts.push(<span key={`t${k++}`}>{text.slice(last, m.index)}</span>);
    const val = filledValues?.[m[1] - 1];
    parts.push(
      val ? (
        <strong key={`v${k++}`}>{val}</strong>
      ) : (
        <Box
          key={`v${k++}`}
          component="span"
          sx={{ bgcolor: '#DFF3FB', border: '1px solid #A6DEEB', borderRadius: 0.75, px: 0.5, mx: 0.15, fontFamily: 'monospace', fontSize: 12 }}
        >
          {`{{${m[1]}}}`}
        </Box>
      )
    );
    last = m.index + m[0].length;
  }
  parts.push(<span key={`t${k++}`}>{(text || '').slice(last)}</span>);
  return parts;
}

/**
 * Renders a template doc/builder-form as a WhatsApp sent message.
 * Accepts: { headerType, headerContent, headerMediaUrl, bodyText,
 *            footerText, buttons[], cards[], sampleValues }
 */
export default function WhatsAppBubble({ template, maxWidth = 340 }) {
  const t = template || {};
  const isCarousel = t.templateType === 'carousel' || (t.cards?.length > 0);
  const headerSamples = t.sampleValues?.header || [];
  const bodySamples = t.sampleValues?.body || [];

  return (
    <Box sx={{ maxWidth, ml: 'auto' }}>
      <Box sx={{ bgcolor: '#DCF8C6', borderRadius: 2, borderTopRightRadius: 0, p: 1.25, boxShadow: 1 }}>
        {/* Header */}
        {!isCarousel && t.headerType === 'text' && t.headerContent && (
          <Typography fontWeight={700} fontSize={14} sx={{ mb: 0.5 }}>
            {renderVarChips(t.headerContent, headerSamples)}
          </Typography>
        )}
        {!isCarousel && t.headerType === 'image' && (
          t.headerMediaUrl || t.headerHandle ? (
            <Box
              component="img"
              src={t.headerMediaUrl}
              alt="header"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              sx={{ width: '100%', borderRadius: 1, mb: 0.75, maxHeight: 180, objectFit: 'cover', display: t.headerMediaUrl ? 'block' : 'none' }}
            />
          ) : null
        )}
        {!isCarousel && ['image'].includes(t.headerType) && !t.headerMediaUrl && (
          <Box sx={{ bgcolor: '#CFE9F5', borderRadius: 1, mb: 0.75, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#455964', fontSize: 12 }}>
            Image header{t.headerHandle ? '' : ' (no sample)'}
          </Box>
        )}
        {!isCarousel && ['video', 'document'].includes(t.headerType) && (
          <Box sx={{ bgcolor: '#CFE9F5', borderRadius: 1, mb: 0.75, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#455964', fontSize: 12 }}>
            {t.headerType === 'video' ? '▶ Video header' : '📄 Document header'}
          </Box>
        )}

        {/* Body */}
        <Typography fontSize={13.5} sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {renderVarChips(t.bodyText, bodySamples)}
        </Typography>

        {/* Footer */}
        {t.footerText && (
          <Typography fontSize={11.5} color="#6A7175" sx={{ mt: 0.75 }}>{t.footerText}</Typography>
        )}

        {/* Timestamp row */}
        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.4}>
          <Typography fontSize={10.5} color="#8696A0">12:45</Typography>
          <Box sx={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '3px solid #53BDEB', borderBottom: '5px solid #53BDEB', transform: 'rotate(-25deg)' }} />
        </Stack>

        {/* Buttons */}
        {t.buttons?.length > 0 && (
          <>
            <Divider sx={{ my: 1, borderColor: 'rgba(0,0,0,0.08)' }} />
            <Stack divider={<Divider flexItem sx={{ borderColor: 'rgba(0,0,0,0.06)' }} />}>
              {t.buttons.map((b, i) => (
                <Stack key={i} direction="row" spacing={0.75} alignItems="center" justifyContent="center" sx={{ py: 0.75, color: '#00A5F4' }}>
                  {BUTTON_ICONS[b.type]}
                  <Typography fontSize={13} fontWeight={600}>{b.text || `${String(b.type || '').toLowerCase()} button`}</Typography>
                </Stack>
              ))}
            </Stack>
          </>
        )}
      </Box>

      {/* Carousel cards */}
      {isCarousel && (
        <Stack direction="row" spacing={1} sx={{ mt: 1, overflowX: 'auto', pb: 1 }}>
          {(t.cards || []).map((card, i) => (
            <Box key={i} sx={{ minWidth: 200, bgcolor: '#DCF8C6', borderRadius: 2, p: 1, boxShadow: 1 }}>
              <Box sx={{ height: 100, borderRadius: 1, mb: 0.75, overflow: 'hidden', bgcolor: '#CFE9F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.headerMediaUrl || card.headerHandle ? (
                  <Box
                    component="img"
                    src={card.headerMediaUrl}
                    alt={`card ${i + 1}`}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Typography fontSize={11} color="#455964">Image</Typography>
                )}
              </Box>
              <Typography fontSize={12.5} sx={{ minHeight: 34, wordBreak: 'break-word' }}>{renderVarChips(card.bodyText)}</Typography>
              {card.buttons?.filter((b) => b.text).map((b, j) => (
                <Stack key={j} direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ pt: 0.5, color: '#00A5F4' }}>
                  {BUTTON_ICONS[b.type]}
                  <Typography fontSize={12} fontWeight={600}>{b.text}</Typography>
                </Stack>
              ))}
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
